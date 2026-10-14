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
	platformToolsVersion = "37.0.1"
	// Pin history: Google republished 37.0.1-win.zip (SHA rotated from
	// 84df1e... to 45f4d6... on 2026-08-27). The pin was removed for a while,
	// which silently disabled verification — pins below were re-derived from
	// the live archives on 2026-10-14. Google can rotate pins on republish;
	// when a download fails checksum, re-hash the official archive and update
	// the pin (do not remove it). scrcpy pins come from the immutable GitHub
	// release and its SHA256SUMS.txt.
	platformToolsLinuxSHA256   = "d230f13842f60f782a8645f9c813f8f845bf36089ea7289f28c48f17979313f1"
	platformToolsDarwinSHA256  = "ee39ad5967e95c2a07f04dbcbde96b1a0c916ba376096db5d2f498b7727a5d1d"
	platformToolsWindowsSHA256 = "45f4d63113e895ebde0c90f194099a4676b6ac653bd28d54314a9e022bbc1a99"
	scrcpyVersion              = "4.0"
	scrcpyLinuxSHA256          = "7daf05af5d575862e62b068cf6852d6068faf7ef3178f3735e3953e778fbf0ab"
	scrcpyDarwinSHA256         = "b83169f856d7022ed0e4428d98acea18dde2d63f49611b52ea137577ce4efe6b"
	scrcpyWindowsSHA256        = "75dbeb5b00e6f64292f26f70900ae55ca397786bdfb0b9bbeb481a0549047457"
	eventName                  = "binary_download_progress"
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

// resolvePlatformToolsArchive maps GOOS to the official archive name and its
// pinned sha256. Unsupported OS values return an error instead of building a
// bogus URL.
func resolvePlatformToolsArchive(goos string) (archive string, sha256 string, err error) {
	switch goos {
	case "linux":
		return fmt.Sprintf("platform-tools_r%s-linux.zip", platformToolsVersion), platformToolsLinuxSHA256, nil
	case "darwin":
		return fmt.Sprintf("platform-tools_r%s-darwin.zip", platformToolsVersion), platformToolsDarwinSHA256, nil
	case "windows":
		return fmt.Sprintf("platform-tools_r%s-win.zip", platformToolsVersion), platformToolsWindowsSHA256, nil
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
		return fmt.Sprintf("scrcpy-linux-%s-v%s.tar.gz", archSlug, scrcpyVersion), scrcpyLinuxSHA256, nil
	case "darwin":
		return fmt.Sprintf("scrcpy-macos-%s-v%s.tar.gz", archSlug, scrcpyVersion), scrcpyDarwinSHA256, nil
	case "windows":
		return fmt.Sprintf("scrcpy-win64-v%s.zip", scrcpyVersion), scrcpyWindowsSHA256, nil
	default:
		return "", "", core.NewOperationError("download_scrcpy", "unsupported OS", goos, false)
	}
}

func (s *Service) DownloadScrcpy(ctx context.Context) error {
	archiveName, expectedSHA256, err := resolveScrcpyArchive(runtime.GOOS, runtime.GOARCH)
	if err != nil {
		return err
	}
	url := fmt.Sprintf("https://github.com/Genymobile/scrcpy/releases/download/v%s/%s", scrcpyVersion, archiveName)

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
