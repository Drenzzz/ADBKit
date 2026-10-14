package download

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"ADBKit/internal/core"

	"github.com/wailsapp/wails/v3/pkg/application"
)

const (
	eventName = "binary_download_progress"
)

// archiveOSSuffix maps GOOS to the platform-tools archive filename suffix.
func archiveOSSuffix(goos string) string {
	if goos == "windows" {
		return "win"
	}
	return goos
}

type ProgressEvent struct {
	Name          string  `json:"name"`
	Percent       float64 `json:"percent"`
	BytesReceived int64   `json:"bytesReceived"`
	BytesTotal    int64   `json:"bytesTotal"`
	Status        string  `json:"status"`
}

type Service struct {
	ctx     context.Context
	dataDir string
}

func NewService(ctx context.Context, dataDir string) *Service {
	return &Service{ctx: ctx, dataDir: dataDir}
}

// resolvePlatformToolsArchive maps GOOS to the official archive name and its
// pinned sha256. Unsupported OS values return an error instead of building a
// bogus URL.
func resolvePlatformToolsArchive(goos string) (archive string, sha256 string, err error) {
	switch goos {
	case "linux", "darwin", "windows":
		return fmt.Sprintf("platform-tools_r%s-%s.zip", downloadManifest.PlatformToolsVersion, archiveOSSuffix(goos)), downloadManifest.PlatformToolsSHA256[goos], nil
	default:
		return "", "", core.NewOperationError("download_platform_tools", "unsupported OS", goos, false)
	}
}

func (s *Service) DownloadPlatformTools(ctx context.Context) error {
	archiveName, expectedSHA256, err := resolvePlatformToolsArchive(runtime.GOOS)
	if err != nil {
		return err
	}
	url := "https://dl.google.com/android/repository/" + archiveName

	s.emitProgress("platform-tools", 0, 0, 0, "downloading")

	archivePath := filepath.Join(s.dataDir, "bin", "platform-tools.zip")
	defer os.Remove(archivePath)

	progressFn := func(received, total int64) {
		pct := 0.0
		if total > 0 {
			pct = float64(received) / float64(total) * 100
		}
		s.emitProgress("platform-tools", pct, received, total, "downloading")
	}

	dl := NewDownloader(progressFn)
	if err := dl.Fetch(ctx, url, archivePath); err != nil {
		s.emitProgress("platform-tools", 0, 0, 0, "error")
		return err
	}
	if expectedSHA256 != "" {
		if err := VerifySHA256(archivePath, expectedSHA256); err != nil {
			s.emitProgress("platform-tools", 0, 0, 0, "error")
			return err
		}
	}

	s.emitProgress("platform-tools", 50, 0, 0, "extracting")

	tmpDir := filepath.Join(s.dataDir, "bin", ".extract-platform-tools")
	defer os.RemoveAll(tmpDir)

	if err := ExtractZip(archivePath, tmpDir); err != nil {
		s.emitProgress("platform-tools", 0, 0, 0, "error")
		return err
	}

	extractedDir, err := FindExtractedDir(tmpDir, "platform-tools")
	if err != nil {
		s.emitProgress("platform-tools", 0, 0, 0, "error")
		return err
	}
	if err := ValidatePackageContents(extractedDir, []string{"adb", "fastboot"}); err != nil {
		s.emitProgress("platform-tools", 0, 0, 0, "error")
		return err
	}

	destDir := filepath.Join(s.dataDir, "bin", "platform-tools")
	if err := MoveExtractedDir(extractedDir, destDir); err != nil {
		s.emitProgress("platform-tools", 0, 0, 0, "error")
		return err
	}

	if err := ValidatePackageContents(destDir, []string{"adb", "fastboot"}); err != nil {
		s.emitProgress("platform-tools", 0, 0, 0, "error")
		return err
	}

	s.cleanupOldStandalone("adb", "fastboot")

	s.emitProgress("platform-tools", 100, 0, 0, "done")
	return nil
}

// resolveScrcpyArchive maps GOOS/GOARCH to the official release asset and its
// pinned sha256. Upstream publishes no linux-aarch64 asset (404), so that
// combination is rejected explicitly instead of downloading an error page.
func resolveScrcpyArchive(goos, goarch string) (archive string, sha256 string, err error) {
	var archSlug string
	switch goarch {
	case "amd64":
		archSlug = "x86_64"
	case "arm64":
		archSlug = "aarch64"
	default:
		return "", "", core.NewOperationError("download_scrcpy", "unsupported architecture", goarch, false)
	}

	switch goos {
	case "linux":
		if goarch == "arm64" {
			return "", "", core.NewOperationError("download_scrcpy", "no upstream package for this platform", "linux-aarch64 is not published by scrcpy releases", false)
		}
		return fmt.Sprintf("scrcpy-linux-%s-v%s.tar.gz", archSlug, downloadManifest.ScrcpyVersion), downloadManifest.ScrcpySHA256[goos], nil
	case "darwin":
		return fmt.Sprintf("scrcpy-macos-%s-v%s.tar.gz", archSlug, downloadManifest.ScrcpyVersion), downloadManifest.ScrcpySHA256[goos], nil
	case "windows":
		return fmt.Sprintf("scrcpy-win64-v%s.zip", downloadManifest.ScrcpyVersion), downloadManifest.ScrcpySHA256[goos], nil
	default:
		return "", "", core.NewOperationError("download_scrcpy", "unsupported OS", goos, false)
	}
}

func (s *Service) DownloadScrcpy(ctx context.Context) error {
	archiveName, expectedSHA256, err := resolveScrcpyArchive(runtime.GOOS, runtime.GOARCH)
	if err != nil {
		return err
	}
	url := fmt.Sprintf("https://github.com/Genymobile/scrcpy/releases/download/v%s/%s", downloadManifest.ScrcpyVersion, archiveName)

	s.emitProgress("scrcpy", 0, 0, 0, "downloading")

	archivePath := filepath.Join(s.dataDir, "bin", archiveName)
	defer os.Remove(archivePath)

	progressFn := func(received, total int64) {
		pct := 0.0
		if total > 0 {
			pct = float64(received) / float64(total) * 100
		}
		s.emitProgress("scrcpy", pct, received, total, "downloading")
	}

	dl := NewDownloader(progressFn)
	if err := dl.Fetch(ctx, url, archivePath); err != nil {
		s.emitProgress("scrcpy", 0, 0, 0, "error")
		return err
	}
	if expectedSHA256 != "" {
		if err := VerifySHA256(archivePath, expectedSHA256); err != nil {
			s.emitProgress("scrcpy", 0, 0, 0, "error")
			return err
		}
	}

	s.emitProgress("scrcpy", 50, 0, 0, "extracting")

	tmpDir := filepath.Join(s.dataDir, "bin", ".extract-scrcpy")
	defer os.RemoveAll(tmpDir)

	if runtime.GOOS == "windows" {
		if err := ExtractZip(archivePath, tmpDir); err != nil {
			s.emitProgress("scrcpy", 0, 0, 0, "error")
			return err
		}
	} else {
		if err := ExtractTarGz(archivePath, tmpDir); err != nil {
			s.emitProgress("scrcpy", 0, 0, 0, "error")
			return err
		}
	}

	extractedDir, err := FindExtractedDir(tmpDir, "scrcpy")
	if err != nil {
		s.emitProgress("scrcpy", 0, 0, 0, "error")
		return err
	}
	if err := ValidateScrcpyPackage(extractedDir); err != nil {
		s.emitProgress("scrcpy", 0, 0, 0, "error")
		return err
	}

	destDir := filepath.Join(s.dataDir, "bin", "scrcpy")
	if err := MoveExtractedDir(extractedDir, destDir); err != nil {
		s.emitProgress("scrcpy", 0, 0, 0, "error")
		return err
	}

	if err := ValidateScrcpyPackage(destDir); err != nil {
		s.emitProgress("scrcpy", 0, 0, 0, "error")
		return err
	}

	s.cleanupOldStandalone("scrcpy")

	s.emitProgress("scrcpy", 100, 0, 0, "done")
	return nil
}

func (s *Service) emitProgress(name string, pct float64, received, total int64, status string) {
	if s.ctx == nil {
		return
	}
	application.Get().Event.Emit(eventName, ProgressEvent{
		Name:          name,
		Percent:       pct,
		BytesReceived: received,
		BytesTotal:    total,
		Status:        strings.ToLower(status),
	})

	_ = time.Now()
}

func (s *Service) cleanupOldStandalone(names ...string) {
	for _, name := range names {
		path := filepath.Join(s.dataDir, "bin", BinaryExecutableName(name))
		os.Remove(path)
	}
}
