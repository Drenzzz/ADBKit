package device

import (
	"ADBKit/internal/core"
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func newScreenshotService(t *testing.T, adbPath string) *Service {
	t.Helper()
	return NewService("", func() core.BinaryPaths {
		return core.BinaryPaths{Adb: adbPath}
	})
}

func TestTakeScreenshot_RequiresSerial(t *testing.T) {
	svc := newScreenshotService(t, "adb")
	_, err := svc.TakeScreenshot(context.Background(), "  ", filepath.Join(t.TempDir(), "shot.png"))
	if err == nil {
		t.Fatal("expected error for empty serial")
	}
}

func TestTakeScreenshot_RequiresOutputPath(t *testing.T) {
	svc := newScreenshotService(t, "adb")
	_, err := svc.TakeScreenshot(context.Background(), "serial", "  ")
	if err == nil {
		t.Fatal("expected error for empty output path")
	}
}

func TestTakeScreenshot_WritesStdoutToFile(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}

	dir := t.TempDir()
	adbPath := filepath.Join(dir, "adb")
	// Binary-safe payload: printf writes the raw bytes without a trailing newline.
	script := "#!/bin/sh\nprintf '\\211PNG\\r\\n\\032\\nBINARY'\n"
	if err := os.WriteFile(adbPath, []byte(script), 0o755); err != nil {
		t.Fatalf("write fake adb: %v", err)
	}

	outputPath := filepath.Join(dir, "shot.png")
	svc := newScreenshotService(t, adbPath)

	message, err := svc.TakeScreenshot(context.Background(), "serial", outputPath)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if message == "" {
		t.Fatal("expected a result message")
	}

	got, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("read screenshot: %v", err)
	}
	want := []byte("\x89PNG\r\n\x1a\nBINARY")
	if string(got) != string(want) {
		t.Fatalf("bytes were altered: got %q want %q", got, want)
	}
}

func TestTakeScreenshot_ReportsAdbStderr(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}

	dir := t.TempDir()
	adbPath := filepath.Join(dir, "adb")
	script := "#!/bin/sh\necho 'error: no devices/emulators found' >&2\nexit 1\n"
	if err := os.WriteFile(adbPath, []byte(script), 0o755); err != nil {
		t.Fatalf("write fake adb: %v", err)
	}

	svc := newScreenshotService(t, adbPath)
	_, err := svc.TakeScreenshot(context.Background(), "serial", filepath.Join(dir, "shot.png"))
	if err == nil {
		t.Fatal("expected error when adb fails")
	}
	opErr, ok := err.(*core.OperationError)
	if !ok {
		t.Fatalf("expected OperationError, got %T", err)
	}
	if opErr.Detail == "" || opErr.Detail == "exit status 1" {
		t.Fatalf("detail must carry adb's message, got %q", opErr.Detail)
	}
}
