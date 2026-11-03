package file

import (
	"ADBKit/internal/core"
	"context"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

// writeFakeAdbFailing writes a stand-in adb that prints an error to stderr and
// exits non-zero, mimicking a real adb transfer failure.
func writeFakeAdbFailing(t *testing.T, stderrLine string) string {
	t.Helper()
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}
	dir := t.TempDir()
	path := filepath.Join(dir, "adb")
	script := "#!/bin/sh\necho \"" + stderrLine + "\" >&2\nexit 1\n"
	if err := os.WriteFile(path, []byte(script), 0o755); err != nil {
		t.Fatalf("write fake adb: %v", err)
	}
	return path
}

func TestPushFile_SurfacesAdbStderr(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}
	const adbError = "adb: error: failed to copy: No space left on device"
	adbPath := writeFakeAdbFailing(t, adbError)

	localPath := filepath.Join(t.TempDir(), "big.bin")
	if err := os.WriteFile(localPath, []byte("payload"), 0o600); err != nil {
		t.Fatalf("write local file: %v", err)
	}

	svc := &Service{
		resolveActiveSerial: func(context.Context) (string, error) { return "serial", nil },
		getBinPath:          func() core.BinaryPaths { return core.BinaryPaths{Adb: adbPath} },
	}

	_, err := svc.PushFile(context.Background(), localPath, "/sdcard/big.bin")
	if err == nil {
		t.Fatal("expected push to fail")
	}

	var operationErr *core.OperationError
	if !errors.As(err, &operationErr) {
		t.Fatalf("expected OperationError, got %T: %v", err, err)
	}
	if !strings.Contains(operationErr.Detail, "No space left on device") {
		t.Fatalf("detail must carry adb's message, got %q", operationErr.Detail)
	}
}

func TestPullFile_SurfacesAdbStderr(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}
	const adbError = "adb: error: remote object '/sdcard/missing.bin' does not exist"
	adbPath := writeFakeAdbFailing(t, adbError)

	svc := &Service{
		resolveActiveSerial: func(context.Context) (string, error) { return "serial", nil },
		getBinPath:          func() core.BinaryPaths { return core.BinaryPaths{Adb: adbPath} },
	}

	dst := filepath.Join(t.TempDir(), "out.bin")
	_, err := svc.PullFile(context.Background(), "/sdcard/missing.bin", dst)
	if err == nil {
		t.Fatal("expected pull to fail")
	}

	var operationErr *core.OperationError
	if !errors.As(err, &operationErr) {
		t.Fatalf("expected OperationError, got %T: %v", err, err)
	}
	if !strings.Contains(operationErr.Detail, "does not exist") {
		t.Fatalf("detail must carry adb's message, got %q", operationErr.Detail)
	}
}
