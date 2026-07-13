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

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

var platformToolsVersion string

const (
	scrcpyVersion = "4.0"
	eventName     = "binary_download_progress"
)

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

func (s *Service) DownloadPlatformTools(ctx context.Context) error {
	goos := runtime.GOOS
	var url string
	switch goos {
	case "linux":
		platformToolsVersion = "35.0.2"
		url = fmt.Sprintf("https://dl.google.com/android/repository/platform-tools_r%s-linux.zip", platformToolsVersion)
	case "darwin":
		platformToolsVersion = "35.0.2"
		url = fmt.Sprintf("https://dl.google.com/android/repository/platform-tools_r%s-darwin.zip", platformToolsVersion)
	case "windows":
		platformToolsVersion = "latest"
		url = fmt.Sprintf("https://dl.google.com/android/repository/platform-tools-%s-windows.zip", platformToolsVersion)
	default:
		return core.NewOperationError("download_platform_tools", "unsupported OS", goos, false)
	}

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

func (s *Service) DownloadScrcpy(ctx context.Context) error {
	goos := runtime.GOOS
	goarch := runtime.GOARCH

	var archSlug string
	switch goarch {
	case "amd64":
		archSlug = "x86_64"
	case "arm64":
		archSlug = "aarch64"
	default:
		return core.NewOperationError("download_scrcpy", "unsupported architecture", goarch, false)
	}

	var url, archiveName string
	switch goos {
	case "linux":
		archiveName = fmt.Sprintf("scrcpy-linux-%s-v%s.tar.gz", archSlug, scrcpyVersion)
	case "darwin":
		archiveName = fmt.Sprintf("scrcpy-macos-%s-v%s.tar.gz", archSlug, scrcpyVersion)
	case "windows":
		archiveName = fmt.Sprintf("scrcpy-win64-v%s.zip", scrcpyVersion)
	default:
		return core.NewOperationError("download_scrcpy", "unsupported OS", goos, false)
	}

	url = fmt.Sprintf("https://github.com/Genymobile/scrcpy/releases/download/v%s/%s", scrcpyVersion, archiveName)

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

	s.emitProgress("scrcpy", 50, 0, 0, "extracting")

	tmpDir := filepath.Join(s.dataDir, "bin", ".extract-scrcpy")
	defer os.RemoveAll(tmpDir)

	if goos == "windows" {
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
	wailsruntime.EventsEmit(s.ctx, eventName, ProgressEvent{
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
