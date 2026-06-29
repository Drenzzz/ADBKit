package download

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"ADBKit/internal/core"
)

const (
	downloadTimeout    = 10 * time.Minute
	chunkSize          = 64 * 1024
	permExecutable     = 0o755
	permDir            = 0o700
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

// Fetch downloads a URL to a local file path, reporting progress.
func (d *Downloader) Fetch(ctx context.Context, url string, destPath string) error {
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

	if err := os.MkdirAll(filepath.Dir(destPath), permDir); err != nil {
		return core.NewOperationError("download", "failed to create directory", err.Error(), true)
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

// ExtractZip extracts a zip archive to destDir.
func ExtractZip(archivePath string, destDir string) error {
	r, err := zip.OpenReader(archivePath)
	if err != nil {
		return core.NewOperationError("extract_zip", "failed to open archive", err.Error(), true)
	}
	defer r.Close()

	for _, f := range r.File {
		target := filepath.Join(destDir, f.Name)

		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(target, permDir); err != nil {
				return err
			}
			continue
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

		target := filepath.Join(destDir, header.Name)

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
		}
	}

	return nil
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
	if err := os.RemoveAll(dst); err != nil {
		return core.NewOperationError("move_extracted_dir", "failed to remove old destination", err.Error(), true)
	}
	if err := os.Rename(src, dst); err == nil {
		return nil
	}
	return copyDir(src, dst)
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
