package packagemgr

import (
	"ADBKit/internal/core"
	"bytes"
	"context"
	"encoding/base64"
	"image"
	"image/png"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/shogo82148/androidbinary/apk"
)

const appIconTimeout = 30 * time.Second

// AppIcon is a cached app identity extracted from an installed APK.
type AppIcon struct {
	PackageName string `json:"packageName"`
	Label       string `json:"label"`
	IconDataURL string `json:"iconDataURL"`
}

// failedApps remembers packages whose APK could not be resolved or pulled so a
// broken session does not hammer ADB with the same failing calls.
var failedApps = make(map[string]struct{})

func appIconCacheDir() (string, error) {
	base, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, "ADBKit", "app-icons")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

// GetAppIcon returns the real label and icon of an installed app. The APK is
// pulled to a temporary file, parsed with androidbinary (manifest + resources
// only, never executed), and the resulting PNG is cached under the user cache
// dir so subsequent calls are instant and offline.
func (s *Service) GetAppIcon(ctx context.Context, packageName string) (AppIcon, error) {
	name, err := validatePackageName(packageName)
	if err != nil {
		return AppIcon{}, err
	}

	cacheDir, err := appIconCacheDir()
	if err != nil {
		return AppIcon{}, core.NewOperationError("app_icon", "Icon cache unavailable", err.Error(), true)
	}
	iconPath := filepath.Join(cacheDir, name+".png")
	labelPath := filepath.Join(cacheDir, name+".label")
	// The cached PNG is read back and served as a data URL so the webview does
	// not need file:// access to the user cache directory.
	iconDataURL := ""
	if pngData, readErr := os.ReadFile(iconPath); readErr == nil {
		iconDataURL = "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngData)
	}
	if _, statErr := os.Stat(iconPath); statErr == nil {
		label := ""
		if data, readErr := os.ReadFile(labelPath); readErr == nil {
			label = strings.TrimSpace(string(data))
		}
		return AppIcon{PackageName: name, Label: label, IconDataURL: iconDataURL}, nil
	}
	// Negative cache: a package that failed before stays silent this session.
	if _, failed := failedApps[name]; failed {
		return AppIcon{PackageName: name, Label: "", IconDataURL: ""}, nil
	}
	// A label without a PNG means the icon decode failed before; serve the
	// label without pulling the APK again.
	if labelData, readErr := os.ReadFile(labelPath); readErr == nil {
		if label := strings.TrimSpace(string(labelData)); label != "" {
			failedApps[name] = struct{}{}
			return AppIcon{PackageName: name, Label: label, IconDataURL: ""}, nil
		}
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return AppIcon{}, err
	}

	pathResult, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "pm", "path", name},
		Timeout: 10 * time.Second,
	})
	if err != nil || pathResult.ExitCode != 0 {
		failedApps[name] = struct{}{}
		return AppIcon{}, core.NewOperationError("app_icon", "Failed to resolve APK path", name, true)
	}
	remotePath, err := parsePackagePathOutput(pathResult.Stdout)
	if err != nil {
		failedApps[name] = struct{}{}
		return AppIcon{}, core.NewOperationError("app_icon", "Failed to resolve APK path", err.Error(), false)
	}

	iconCtx, cancel := context.WithTimeout(ctx, appIconTimeout)
	defer cancel()

	tempDir, err := os.MkdirTemp("", "adbkit-icon-")
	if err != nil {
		return AppIcon{}, core.NewOperationError("app_icon", "Temp dir failed", err.Error(), true)
	}
	defer os.RemoveAll(tempDir)
	localAPK := filepath.Join(tempDir, "base.apk")

	pullResult, err := core.RunCommand(iconCtx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "pull", remotePath, localAPK},
		Timeout: appIconTimeout,
	})
	if err != nil || pullResult.ExitCode != 0 {
		failedApps[name] = struct{}{}
		return AppIcon{}, core.NewOperationError("app_icon", "Failed to pull APK", name, true)
	}

	parsed, err := apk.OpenFile(localAPK)
	if err != nil {
		failedApps[name] = struct{}{}
		return AppIcon{}, core.NewOperationError("app_icon", "Could not read APK", err.Error(), false)
	}
	defer parsed.Close()

	label := name
	if parsedLabel, labelErr := parsed.Label(nil); labelErr == nil && strings.TrimSpace(parsedLabel) != "" {
		label = strings.TrimSpace(parsedLabel)
	}

	var img image.Image
	if parsedIcon, iconErr := parsed.Icon(nil); iconErr == nil {
		img = parsedIcon
	}

	if img != nil {
		var buf bytes.Buffer
		if encodeErr := png.Encode(&buf, img); encodeErr == nil {
			if writeErr := os.WriteFile(iconPath, buf.Bytes(), 0o644); writeErr == nil {
				iconDataURL = "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())
			}
		}
	}
	// Always write the label so a missing icon doesn't re-trigger a pull.
	if writeErr := os.WriteFile(labelPath, []byte(label), 0o644); writeErr != nil {
		return AppIcon{}, core.NewOperationError("app_icon", "Failed to cache label", writeErr.Error(), false)
	}

	return AppIcon{PackageName: name, Label: label, IconDataURL: iconDataURL}, nil
}

// GetAppLabels returns labels for a batch of packages, using the icon cache
// where possible and falling back to the package name without touching ADB.
func (s *Service) GetAppLabels(packageNames []string) map[string]string {
	result := make(map[string]string, len(packageNames))
	cacheDir, err := appIconCacheDir()
	if err != nil {
		return result
	}
	for _, name := range packageNames {
		if data, readErr := os.ReadFile(filepath.Join(cacheDir, name+".label")); readErr == nil {
			if label := strings.TrimSpace(string(data)); label != "" {
				result[name] = label
			}
		}
	}
	return result
}

// GetAppIcons resolves labels and icons for many packages at once. Cached
// entries are answered from disk; the rest are pulled through a small worker
// pool so the first run is parallel instead of one-by-one. Failures degrade
// silently — the grid shows a monogram for those apps.
func (s *Service) GetAppIcons(ctx context.Context, packageNames []string) map[string]AppIcon {
	result := make(map[string]AppIcon, len(packageNames))
	pending := make([]string, 0, len(packageNames))

	cacheDir, err := appIconCacheDir()
	if err == nil {
		for _, name := range packageNames {
			iconPath := filepath.Join(cacheDir, name+".png")
			labelPath := filepath.Join(cacheDir, name+".label")
			if _, statErr := os.Stat(iconPath); statErr == nil {
				label := ""
				if data, readErr := os.ReadFile(labelPath); readErr == nil {
					label = strings.TrimSpace(string(data))
				}
				dataURL := ""
				if pngData, readErr := os.ReadFile(iconPath); readErr == nil {
					dataURL = "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngData)
				}
				result[name] = AppIcon{PackageName: name, Label: label, IconDataURL: dataURL}
			} else {
				pending = append(pending, name)
			}
		}
	}

	const workers = 4
	jobs := make(chan string)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for name := range jobs {
				icon, err := s.GetAppIcon(ctx, name)
				if err == nil {
					mu.Lock()
					result[name] = icon
					mu.Unlock()
				}
			}
		}()
	}

	for _, name := range pending {
		jobs <- name
	}
	close(jobs)
	wg.Wait()

	return result
}
