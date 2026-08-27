package download

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"ADBKit/internal/core"
)

const (
	downloadTimeout = 10 * time.Minute
	chunkSize       = 64 * 1024
	permExecutable  = 0o755
	permDir         = 0o700

	maxRetries    = 3
	retryBaseWait = time.Second
)

type ProgressFunc func(bytesReceived int64, bytesTotal int64)

type Downloader struct {
	client     *http.Client
	onProgress ProgressFunc
}

func NewDownloader(onProgress ProgressFunc) *Downloader {
	return &Downloader{
		client: &http.Client{
			Timeout: downloadTimeout,
		},
		onProgress: onProgress,
	}
}

// Fetch downloads a URL to a local file path, reporting progress. Transient
// HTTP failures (5xx, network resets) are retried up to maxRetries with
// exponential backoff; context cancellation and 4xx errors fail fast.
func (d *Downloader) Fetch(ctx context.Context, url string, destPath string) error {
	if err := os.MkdirAll(filepath.Dir(destPath), permDir); err != nil {
		return core.NewOperationError("download", "failed to create directory", err.Error(), true)
	}

	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		if ctx.Err() != nil {
			return core.NewOperationError("download", "download cancelled", ctx.Err().Error(), false)
		}
		err := d.fetchOnce(ctx, url, destPath)
		if err == nil {
			return nil
		}
		lastErr = err
		if !isTransientDownloadError(err) {
			return err
		}
		if attempt < maxRetries {
			wait := retryBaseWait << (attempt - 1)
			select {
			case <-time.After(wait):
			case <-ctx.Done():
				return core.NewOperationError("download", "download cancelled during retry", ctx.Err().Error(), false)
			}
		}
	}
	return lastErr
}

// fetchOnce performs a single download attempt (no retry).
func (d *Downloader) fetchOnce(ctx context.Context, url string, destPath string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return core.NewOperationError("download", "failed to create request", err.Error(), true)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return core.NewOperationError("download", "failed to download", err.Error(), true)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return core.NewOperationError("download", fmt.Sprintf("server returned %d", resp.StatusCode), url, true)
	}

	tmpPath := destPath + ".tmp"
	f, err := os.Create(tmpPath)
	if err != nil {
		return core.NewOperationError("download", "failed to create temp file", err.Error(), true)
	}

	var received int64
	total := resp.ContentLength
	buf := make([]byte, chunkSize)

	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			if _, writeErr := f.Write(buf[:n]); writeErr != nil {
				f.Close()
				os.Remove(tmpPath)
				return core.NewOperationError("download", "failed to write chunk", writeErr.Error(), true)
			}
			received += int64(n)
			if d.onProgress != nil {
				d.onProgress(received, total)
			}
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			f.Close()
			os.Remove(tmpPath)
			return core.NewOperationError("download", "failed to read response body", readErr.Error(), true)
		}
	}

	if err := f.Close(); err != nil {
		os.Remove(tmpPath)
		return core.NewOperationError("download", "failed to close temp file", err.Error(), true)
	}

	if err := os.Rename(tmpPath, destPath); err != nil {
		os.Remove(tmpPath)
		return core.NewOperationError("download", "failed to finalize download", err.Error(), true)
	}

	return nil
}

// isTransientDownloadError decides whether a download error should be retried.
// 5xx and network-level errors are transient; 4xx (and "finalized" errors)
// fail fast because they indicate the request itself is wrong.
func isTransientDownloadError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	if strings.Contains(msg, "server returned 5") {
		return true
	}
	if strings.Contains(msg, "server returned 429") {
		return true
	}
	if strings.Contains(msg, "connection reset") ||
		strings.Contains(msg, "broken pipe") ||
		strings.Contains(msg, "EOF") ||
		strings.Contains(msg, "timeout") {
		return true
	}
	return false
}

// VerifySHA256 confirms a downloaded archive matches its pinned SHA-256 digest.
func VerifySHA256(path, expected string) error {
	f, err := os.Open(path)
	if err != nil {
		return core.NewOperationError("verify_checksum", "failed to open archive", err.Error(), true)
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return core.NewOperationError("verify_checksum", "failed to hash archive", err.Error(), true)
	}
	if actual := hex.EncodeToString(h.Sum(nil)); !strings.EqualFold(actual, expected) {
		return core.NewOperationError("verify_checksum", "downloaded archive checksum mismatch", "expected "+expected+", got "+actual, false)
	}
	return nil
}

// ExtractZip extracts a zip archive to destDir.
func ExtractZip(archivePath string, destDir string) error {
	r, err := zip.OpenReader(archivePath)
	if err != nil {
		return core.NewOperationError("extract_zip", "failed to open archive", err.Error(), true)
	}
	defer r.Close()

	for _, f := range r.File {
		target, err := safeArchiveTarget(destDir, f.Name)
		if err != nil {
			return err
		}

		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(target, permDir); err != nil {
				return err
			}
			continue
		}
		if !f.Mode().IsRegular() {
			return core.NewOperationError("extract_zip", "archive contains unsupported entry type", f.Name, false)
		}

		if err := os.MkdirAll(filepath.Dir(target), permDir); err != nil {
			return err
		}

		outFile, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, permExecutable)
		if err != nil {
			return err
		}

		inFile, err := f.Open()
		if err != nil {
			outFile.Close()
			return err
		}

		if _, err := io.Copy(outFile, inFile); err != nil {
			outFile.Close()
			inFile.Close()
			return err
		}
		outFile.Close()
		inFile.Close()
	}

	return nil
}

// ExtractTarGz extracts a tar.gz archive to destDir.
func ExtractTarGz(archivePath string, destDir string) error {
	f, err := os.Open(archivePath)
	if err != nil {
		return core.NewOperationError("extract_tar_gz", "failed to open archive", err.Error(), true)
	}
	defer f.Close()

	gz, err := gzip.NewReader(f)
	if err != nil {
		return core.NewOperationError("extract_tar_gz", "failed to create gzip reader", err.Error(), true)
	}
	defer gz.Close()

	tr := tar.NewReader(gz)
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return core.NewOperationError("extract_tar_gz", "failed to read tar entry", err.Error(), true)
		}

		target, err := safeArchiveTarget(destDir, header.Name)
		if err != nil {
			return err
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, permDir); err != nil {
				return err
			}
		case tar.TypeReg:
			if err := os.MkdirAll(filepath.Dir(target), permDir); err != nil {
				return err
			}
			outFile, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, os.FileMode(header.Mode)&0o777|permExecutable)
			if err != nil {
				return err
			}
			if _, err := io.Copy(outFile, tr); err != nil {
				outFile.Close()
				return err
			}
			outFile.Close()
		default:
			return core.NewOperationError("extract_tar_gz", "archive contains unsupported entry type", header.Name, false)
		}
	}

	return nil
}

// safeArchiveTarget rejects archive paths that could escape the extraction root.
// Archive paths always use slash separators, but normalize backslashes too because
// Windows treats them as separators when writing managed ZIP packages.
func safeArchiveTarget(destDir, archiveName string) (string, error) {
	normalized := strings.ReplaceAll(archiveName, "\\", "/")
	cleaned := path.Clean(normalized)
	if cleaned == "." || path.IsAbs(cleaned) || strings.Contains(cleaned, ":") {
		return "", core.NewOperationError("extract_archive", "archive entry path is invalid", archiveName, false)
	}
	if cleaned == ".." || strings.HasPrefix(cleaned, "../") {
		return "", core.NewOperationError("extract_archive", "archive entry escapes extraction directory", archiveName, false)
	}
	return filepath.Join(destDir, filepath.FromSlash(cleaned)), nil
}

// BinaryExecutableName returns the OS-specific binary name.
func BinaryExecutableName(name string) string {
	if runtime.GOOS == "windows" {
		return name + ".exe"
	}
	return name
}

// FindBinaryInDir searches a directory tree for a named binary and returns its path.
func FindBinaryInDir(root string, name string) (string, error) {
	execName := BinaryExecutableName(name)
	var found string
	err := filepath.Walk(root, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if info.IsDir() {
			return nil
		}
		if strings.EqualFold(filepath.Base(path), execName) {
			found = path
			return filepath.SkipAll
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	if found == "" {
		return "", core.NewOperationError("find_binary", execName+" not found in extraction", root, false)
	}
	return found, nil
}

// AtomicBinaryMove moves a binary from src to dst atomically and sets executable permission.
func AtomicBinaryMove(src string, dst string) error {
	if err := os.MkdirAll(filepath.Dir(dst), permDir); err != nil {
		return core.NewOperationError("atomic_move", "failed to create target directory", err.Error(), true)
	}

	tmpDst := dst + ".tmp"
	if err := os.Rename(src, tmpDst); err != nil {
		return core.NewOperationError("atomic_move", "failed to rename source to temp", err.Error(), true)
	}

	if err := os.Chmod(tmpDst, permExecutable); err != nil {
		os.Remove(tmpDst)
		return core.NewOperationError("atomic_move", "failed to chmod", err.Error(), true)
	}

	if err := os.Rename(tmpDst, dst); err != nil {
		os.Remove(tmpDst)
		return core.NewOperationError("atomic_move", "failed to finalize move", err.Error(), true)
	}

	return nil
}

// CurrentPlatformArch returns a string like "linux-x86_64" or "windows-x86_64".
func CurrentPlatformArch() string {
	goos := runtime.GOOS
	goarch := runtime.GOARCH
	switch goarch {
	case "amd64":
		return goos + "-x86_64"
	case "arm64":
		return goos + "-aarch64"
	default:
		return goos + "-" + goarch
	}
}

// FindExtractedDir finds the first directory whose name starts with prefix
// inside root. Archives typically extract to a single top-level folder
// (e.g. "platform-tools/", "scrcpy-linux-x86_64-v3.3.1/").
func FindExtractedDir(root string, prefix string) (string, error) {
	entries, err := os.ReadDir(root)
	if err != nil {
		return "", core.NewOperationError("find_extracted_dir", "failed to read extraction root", err.Error(), false)
	}
	for _, entry := range entries {
		if entry.IsDir() && strings.HasPrefix(entry.Name(), prefix) {
			return filepath.Join(root, entry.Name()), nil
		}
	}
	return "", core.NewOperationError("find_extracted_dir", "no directory matching prefix '"+prefix+"' found in extraction", root, false)
}

// MoveExtractedDir moves src directory to dst. Uses os.Rename for same-device
// atomic move; falls back to copy+delete for cross-device scenarios.
func MoveExtractedDir(src string, dst string) error {
	staging := dst + ".next"
	backup := dst + ".previous"
	if err := os.RemoveAll(staging); err != nil {
		return core.NewOperationError("move_extracted_dir", "failed to clear staging directory", err.Error(), true)
	}
	if err := copyDir(src, staging); err != nil {
		return core.NewOperationError("move_extracted_dir", "failed to stage extracted package", err.Error(), true)
	}
	if err := os.RemoveAll(backup); err != nil {
		return core.NewOperationError("move_extracted_dir", "failed to clear package backup", err.Error(), true)
	}
	if _, err := os.Stat(dst); err == nil {
		if err := os.Rename(dst, backup); err != nil {
			return core.NewOperationError("move_extracted_dir", "failed to back up current package", err.Error(), true)
		}
	}
	if err := os.Rename(staging, dst); err != nil {
		if _, restoreErr := os.Stat(backup); restoreErr == nil {
			_ = os.Rename(backup, dst)
		}
		return core.NewOperationError("move_extracted_dir", "failed to activate extracted package", err.Error(), true)
	}
	if err := os.RemoveAll(backup); err != nil {
		return core.NewOperationError("move_extracted_dir", "package installed but failed to remove backup", err.Error(), true)
	}
	if err := os.RemoveAll(src); err != nil {
		return core.NewOperationError("move_extracted_dir", "package installed but failed to clear extraction source", err.Error(), true)
	}
	return nil
}

func copyDir(src string, dst string) error {
	if err := os.MkdirAll(dst, permDir); err != nil {
		return err
	}
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())
		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
}

func copyFile(src string, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	if err := os.MkdirAll(filepath.Dir(dst), permDir); err != nil {
		return err
	}
	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, permExecutable)
	if err != nil {
		return err
	}
	defer out.Close()
	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	info, err := os.Stat(src)
	if err == nil {
		os.Chmod(dst, info.Mode())
	}
	return nil
}

func ValidatePackageContents(dir string, requiredFiles []string) error {
	for _, name := range requiredFiles {
		path := filepath.Join(dir, BinaryExecutableName(name))
		if _, err := os.Stat(path); os.IsNotExist(err) {
			return core.NewOperationError("validate_package", "required file missing from extracted package", name, false)
		}
	}
	return nil
}

func ValidateScrcpyPackage(dir string) error {
	info, err := os.Stat(filepath.Join(dir, BinaryExecutableName("scrcpy")))
	if err != nil || info.IsDir() {
		return core.NewOperationError("validate_package", "scrcpy binary missing from extracted package", "scrcpy", false)
	}
	serverPath := filepath.Join(dir, "scrcpy-server")
	if _, err := os.Stat(serverPath); os.IsNotExist(err) {
		return core.NewOperationError("validate_package", "scrcpy-server missing from extracted package", "scrcpy-server", false)
	}
	return nil
}
