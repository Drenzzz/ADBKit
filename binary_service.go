package main

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// BinaryStatus represents the state of a detected binary.
type BinaryStatus string

const (
	BinaryFound      BinaryStatus = "found"
	BinaryMissing    BinaryStatus = "missing"
	BinaryInvalid    BinaryStatus = "invalid_path"
	BinaryDownloading BinaryStatus = "downloading"
	BinaryReady      BinaryStatus = "ready"
	BinarySkipped    BinaryStatus = "skipped"
)

// BinaryInfo holds the detection result for a single binary.
type BinaryInfo struct {
	Name    string       `json:"name"`
	Path    string       `json:"path"`
	Source  string       `json:"source"`
	Status  BinaryStatus `json:"status"`
	Version string       `json:"version,omitempty"`
	Reason  string       `json:"reason,omitempty"`
}

// BinaryService manages detection and validation of external binaries.
type BinaryService struct {
	dataDir string
}

// NewBinaryService creates a new BinaryService.
func NewBinaryService(dataDir string) *BinaryService {
	return &BinaryService{dataDir: dataDir}
}

// DetectAll runs detection for adb, fastboot, and scrcpy.
func (bs *BinaryService) DetectAll(cfg *AppConfig) []*BinaryInfo {
	results := make([]*BinaryInfo, 0, 3)
	results = append(results, bs.Detect("adb", cfg.AdbPath))
	results = append(results, bs.Detect("fastboot", cfg.FastbootPath))
	results = append(results, bs.DetectScrcpy(cfg.ScrcpyPath, cfg.ScrcpyEnabled))
	return results
}

// Detect runs the full discovery and validation flow for a required binary.
func (bs *BinaryService) Detect(name string, configPath string) *BinaryInfo {
	info := &BinaryInfo{Name: name}

	// Step 1: custom path from config
	if configPath != "" {
		if err := ValidateExecutable(configPath); err == nil {
			info.Path = configPath
			info.Source = "config"
			info.Status = BinaryReady
			info.Version = bs.getVersion(name, configPath)
			return info
		}
		info.Path = configPath
		info.Source = "config"
		info.Status = BinaryInvalid
		info.Reason = "saved path is invalid"
	}

	// Step 2: system PATH
	if path, err := exec.LookPath(name); err == nil {
		if err := ValidateExecutable(path); err == nil {
			info.Path = path
			info.Source = "system-path"
			info.Status = BinaryReady
			info.Version = bs.getVersion(name, path)
			return info
		}
	}

	// Step 3: app data bin directory
	appBin := filepath.Join(bs.dataDir, "bin", name)
	if runtime.GOOS == "windows" {
		appBin += ".exe"
	}
	if err := ValidateExecutable(appBin); err == nil {
		info.Path = appBin
		info.Source = "app-data"
		info.Status = BinaryReady
		info.Version = bs.getVersion(name, appBin)
		return info
	}

	// Step 4: common locations per OS
	for _, candidate := range bs.commonPaths(name) {
		if err := ValidateExecutable(candidate); err == nil {
			info.Path = candidate
			info.Source = "common-path"
			info.Status = BinaryReady
			info.Version = bs.getVersion(name, candidate)
			return info
		}
	}

	info.Status = BinaryMissing
	return info
}

// DetectScrcpy runs detection for scrcpy, which is optional.
func (bs *BinaryService) DetectScrcpy(configPath string, enabled bool) *BinaryInfo {
	if !enabled {
		return &BinaryInfo{
			Name:   "scrcpy",
			Status: BinarySkipped,
			Reason: "scrcpy is disabled in config",
		}
	}
	return bs.Detect("scrcpy", configPath)
}

// GetVersion runs the version command for the given binary at path.
func (bs *BinaryService) getVersion(name, path string) string {
	ctx := context.Background()
	result, err := RunCommand(ctx, ExecRequest{
		Command: path,
		Args:    versionArgs(name),
		Timeout: 5e9, // 5 seconds
	})
	if err != nil || result.ExitCode != 0 {
		return ""
	}
	return parseVersion(result.Stdout)
}

func versionArgs(name string) []string {
	switch name {
	case "adb":
		return []string{"version"}
	case "fastboot":
		return []string{"--version"}
	case "scrcpy":
		return []string{"--version"}
	default:
		return []string{"--version"}
	}
}

func parseVersion(output string) string {
	// Extract first line that looks like a version string.
	for _, line := range strings.Split(output, "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			return line
		}
	}
	return ""
}

func (bs *BinaryService) commonPaths(name string) []string {
	home, _ := os.UserHomeDir()

	switch runtime.GOOS {
	case "linux":
		return []string{
			filepath.Join(home, "Android", "Sdk", "platform-tools", name),
			"/usr/bin/" + name,
			"/usr/local/bin/" + name,
		}
	case "darwin":
		return []string{
			filepath.Join(home, "Library", "Android", "sdk", "platform-tools", name),
			"/usr/local/bin/" + name,
			"/opt/homebrew/bin/" + name,
		}
	case "windows":
		appData := os.Getenv("APPDATA")
		return []string{
			filepath.Join(home, "AppData", "Local", "Android", "Sdk", "platform-tools", name+".exe"),
			filepath.Join(appData, "adbkit", "bin", name+".exe"),
		}
	default:
		return nil
	}
}
