package download

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func createTestZip(t *testing.T, entries map[string]string) string {
	t.Helper()
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)
	for name, content := range entries {
		f, err := w.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := f.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(t.TempDir(), "test.zip")
	if err := os.WriteFile(path, buf.Bytes(), 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func createTestTarGz(t *testing.T, entries map[string]string) string {
	t.Helper()
	var buf bytes.Buffer
	gw := gzip.NewWriter(&buf)
	tw := tar.NewWriter(gw)
	for name, content := range entries {
		hdr := &tar.Header{
			Name: name,
			Mode: 0o755,
			Size: int64(len(content)),
		}
		if err := tw.WriteHeader(hdr); err != nil {
			t.Fatal(err)
		}
		if _, err := tw.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	if err := tw.Close(); err != nil {
		t.Fatal(err)
	}
	if err := gw.Close(); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(t.TempDir(), "test.tar.gz")
	if err := os.WriteFile(path, buf.Bytes(), 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestExtractZip(t *testing.T) {
	zipPath := createTestZip(t, map[string]string{
		"platform-tools/adb":      "fake-adb-binary",
		"platform-tools/fastboot": "fake-fastboot-binary",
		"platform-tools/README":   "readme content",
	})

	dest := t.TempDir()
	if err := ExtractZip(zipPath, dest); err != nil {
		t.Fatalf("ExtractZip failed: %v", err)
	}

	adbContent, err := os.ReadFile(filepath.Join(dest, "platform-tools", "adb"))
	if err != nil {
		t.Fatalf("failed to read extracted adb: %v", err)
	}
	if string(adbContent) != "fake-adb-binary" {
		t.Fatalf("adb content mismatch: %q", adbContent)
	}

	fbContent, err := os.ReadFile(filepath.Join(dest, "platform-tools", "fastboot"))
	if err != nil {
		t.Fatalf("failed to read extracted fastboot: %v", err)
	}
	if string(fbContent) != "fake-fastboot-binary" {
		t.Fatalf("fastboot content mismatch: %q", fbContent)
	}
}

func TestExtractTarGz(t *testing.T) {
	tgzPath := createTestTarGz(t, map[string]string{
		"scrcpy-linux-x86_64-v3.3.1/scrcpy": "fake-scrcpy-binary",
		"scrcpy-linux-x86_64-v3.3.1/README": "readme content",
	})

	dest := t.TempDir()
	if err := ExtractTarGz(tgzPath, dest); err != nil {
		t.Fatalf("ExtractTarGz failed: %v", err)
	}

	content, err := os.ReadFile(filepath.Join(dest, "scrcpy-linux-x86_64-v3.3.1", "scrcpy"))
	if err != nil {
		t.Fatalf("failed to read extracted scrcpy: %v", err)
	}
	if string(content) != "fake-scrcpy-binary" {
		t.Fatalf("scrcpy content mismatch: %q", content)
	}
}

func TestAtomicBinaryMove(t *testing.T) {
	tmpDir := t.TempDir()
	src := filepath.Join(tmpDir, "source-binary")
	dst := filepath.Join(tmpDir, "subdir", "dest-binary")

	if err := os.WriteFile(src, []byte("binary-content"), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := AtomicBinaryMove(src, dst); err != nil {
		t.Fatalf("AtomicBinaryMove failed: %v", err)
	}

	if _, err := os.Stat(src); !os.IsNotExist(err) {
		t.Fatal("expected source to be removed after move")
	}

	info, err := os.Stat(dst)
	if err != nil {
		t.Fatalf("expected dest to exist: %v", err)
	}
	if runtime.GOOS != "windows" && info.Mode().Perm()&0o111 == 0 {
		t.Fatal("expected dest to be executable")
	}

	content, err := os.ReadFile(dst)
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != "binary-content" {
		t.Fatalf("content mismatch: %q", content)
	}
}

func TestFindBinaryInDir(t *testing.T) {
	tmpDir := t.TempDir()
	nested := filepath.Join(tmpDir, "platform-tools")
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatal(err)
	}
	adbPath := filepath.Join(nested, BinaryExecutableName("adb"))
	if err := os.WriteFile(adbPath, []byte("fake"), 0o755); err != nil {
		t.Fatal(err)
	}

	found, err := FindBinaryInDir(tmpDir, "adb")
	if err != nil {
		t.Fatalf("FindBinaryInDir failed: %v", err)
	}
	if found != adbPath {
		t.Fatalf("expected %q, got %q", adbPath, found)
	}
}

func TestFindBinaryInDirMissing(t *testing.T) {
	tmpDir := t.TempDir()
	_, err := FindBinaryInDir(tmpDir, "nonexistent")
	if err == nil {
		t.Fatal("expected error for missing binary")
	}
}

func TestFetchCancellation(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", "1000000")
		w.WriteHeader(200)
		flusher, ok := w.(http.Flusher)
		if !ok {
			return
		}
		for i := 0; i < 100; i++ {
			_, _ = w.Write(bytes.Repeat([]byte("x"), 10000))
			flusher.Flush()
		}
	}))
	defer srv.Close()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	dl := NewDownloader(nil)
	tmpPath := filepath.Join(t.TempDir(), "downloaded")
	err := dl.Fetch(ctx, srv.URL, tmpPath)
	if err == nil {
		t.Fatal("expected error from cancelled context")
	}
}

func TestFetchSuccess(t *testing.T) {
	payload := []byte("hello-download-content")
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write(payload)
	}))
	defer srv.Close()

	dl := NewDownloader(nil)
	tmpPath := filepath.Join(t.TempDir(), "downloaded")
	if err := dl.Fetch(context.Background(), srv.URL, tmpPath); err != nil {
		t.Fatalf("Fetch failed: %v", err)
	}

	content, err := os.ReadFile(tmpPath)
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != string(payload) {
		t.Fatalf("content mismatch: %q", content)
	}
}

func TestFetchHTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
	}))
	defer srv.Close()

	dl := NewDownloader(nil)
	tmpPath := filepath.Join(t.TempDir(), "downloaded")
	err := dl.Fetch(context.Background(), srv.URL, tmpPath)
	if err == nil {
		t.Fatal("expected error for 500 status")
	}
}

func TestFindExtractedDir(t *testing.T) {
	tmpDir := t.TempDir()
	nested := filepath.Join(tmpDir, "platform-tools")
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatal(err)
	}

	found, err := FindExtractedDir(tmpDir, "platform-tools")
	if err != nil {
		t.Fatalf("FindExtractedDir failed: %v", err)
	}
	if found != nested {
		t.Fatalf("expected %q, got %q", nested, found)
	}
}

func TestFindExtractedDirNested(t *testing.T) {
	tmpDir := t.TempDir()
	nested := filepath.Join(tmpDir, "scrcpy-linux-x86_64-v3.3.1")
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatal(err)
	}

	found, err := FindExtractedDir(tmpDir, "scrcpy")
	if err != nil {
		t.Fatalf("FindExtractedDir failed: %v", err)
	}
	if found != nested {
		t.Fatalf("expected %q, got %q", nested, found)
	}
}

func TestFindExtractedDirMissing(t *testing.T) {
	tmpDir := t.TempDir()
	_, err := FindExtractedDir(tmpDir, "nonexistent")
	if err == nil {
		t.Fatal("expected error for missing directory")
	}
}

func TestMoveExtractedDir(t *testing.T) {
	src := t.TempDir()
	subdir := filepath.Join(src, "platform-tools")
	if err := os.MkdirAll(subdir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(subdir, "adb"), []byte("fake-adb"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(subdir, "fastboot"), []byte("fake-fb"), 0o755); err != nil {
		t.Fatal(err)
	}

	dst := filepath.Join(t.TempDir(), "dest-platform-tools")
	if err := MoveExtractedDir(subdir, dst); err != nil {
		t.Fatalf("MoveExtractedDir failed: %v", err)
	}

	if _, err := os.Stat(filepath.Join(dst, "adb")); err != nil {
		t.Fatalf("expected adb in destination: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, "fastboot")); err != nil {
		t.Fatalf("expected fastboot in destination: %v", err)
	}
	if _, err := os.Stat(subdir); !os.IsNotExist(err) {
		t.Fatal("expected source to be removed after move")
	}
}
