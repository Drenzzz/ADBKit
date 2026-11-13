package file

import (
	"ADBKit/internal/core"
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

// writeFakeAdbPush writes a stand-in adb that records its push args to a log
// file and exits successfully, so batch behaviour can be asserted without a
// device.
func writeFakeAdbPush(t *testing.T, logPath string) string {
	t.Helper()
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}
	dir := t.TempDir()
	path := filepath.Join(dir, "adb")
	script := "#!/bin/sh\nprintf '%s\\n' \"$*\" >> " + logPath + "\nexit 0\n"
	if err := os.WriteFile(path, []byte(script), 0o755); err != nil {
		t.Fatalf("write fake adb: %v", err)
	}
	return path
}

func TestPushMultiplePaths_MixedFilesAndFolders(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}
	logPath := filepath.Join(t.TempDir(), "adb-calls.log")
	adbPath := writeFakeAdbPush(t, logPath)

	// One folder (recursive) and one plain file, pushed to the same remote dir.
	localDir := t.TempDir()
	folder := filepath.Join(localDir, "MyFolder")
	if err := os.MkdirAll(filepath.Join(folder, "sub"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(folder, "a.txt"), []byte("a"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(folder, "sub", "b.txt"), []byte("b"), 0o600); err != nil {
		t.Fatal(err)
	}
	singleFile := filepath.Join(localDir, "single.dat")
	if err := os.WriteFile(singleFile, []byte("s"), 0o600); err != nil {
		t.Fatal(err)
	}

	svc := &Service{
		resolveActiveSerial: func(context.Context) (string, error) { return "serial", nil },
		getBinPath:          func() core.BinaryPaths { return core.BinaryPaths{Adb: adbPath} },
	}

	message, err := svc.PushMultiplePaths(context.Background(), []string{folder, singleFile}, "/sdcard/")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(message, "2 path(s)") {
		t.Errorf("message should report 2 pushed paths, got %q", message)
	}

	data, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatalf("fake adb was never invoked: %v", err)
	}
	calls := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(calls) != 2 {
		t.Fatalf("expected 2 adb push invocations, got %d: %v", len(calls), calls)
	}
	for _, call := range calls {
		if !strings.Contains(call, "push") || !strings.Contains(call, "-s serial") {
			t.Errorf("unexpected adb args: %q", call)
		}
	}
	if !strings.Contains(calls[0], "/sdcard/MyFolder") {
		t.Errorf("folder should be pushed to /sdcard/MyFolder, got %q", calls[0])
	}
	if !strings.Contains(calls[1], "/sdcard/single.dat") {
		t.Errorf("file should be pushed to /sdcard/single.dat, got %q", calls[1])
	}
}

func TestPushMultiplePaths_RejectsRestrictedRemote(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}
	logPath := filepath.Join(t.TempDir(), "adb-calls.log")
	adbPath := writeFakeAdbPush(t, logPath)

	localDir := t.TempDir()
	folder := filepath.Join(localDir, "MyFolder")
	if err := os.MkdirAll(folder, 0o755); err != nil {
		t.Fatal(err)
	}

	svc := &Service{
		resolveActiveSerial: func(context.Context) (string, error) { return "serial", nil },
		getBinPath:          func() core.BinaryPaths { return core.BinaryPaths{Adb: adbPath} },
	}

	_, err := svc.PushMultiplePaths(context.Background(), []string{folder}, "/system")
	if err == nil {
		t.Fatal("expected error for protected remote path")
	}
	if data, readErr := os.ReadFile(logPath); readErr == nil && len(data) > 0 {
		t.Errorf("no adb call should happen for a rejected destination, got %q", data)
	}
}

func TestPushMultiplePaths_EmptyList(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(context.Context) (string, error) { return "serial", nil },
	}
	_, err := svc.PushMultiplePaths(context.Background(), nil, "/sdcard")
	if err == nil {
		t.Fatal("expected error for empty path list")
	}
}

func TestPushMultiplePaths_CarriesFailuresWithoutAborting(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-script fake adb is POSIX only")
	}
	logPath := filepath.Join(t.TempDir(), "adb-calls.log")
	adbPath := writeFakeAdbPush(t, logPath)

	// A missing path fails, the valid one must still be pushed.
	missing := filepath.Join(t.TempDir(), "gone")
	validFile := filepath.Join(t.TempDir(), "ok.txt")
	if err := os.WriteFile(validFile, []byte("ok"), 0o600); err != nil {
		t.Fatal(err)
	}

	svc := &Service{
		resolveActiveSerial: func(context.Context) (string, error) { return "serial", nil },
		getBinPath:          func() core.BinaryPaths { return core.BinaryPaths{Adb: adbPath} },
	}

	message, err := svc.PushMultiplePaths(context.Background(), []string{missing, validFile}, "/sdcard/")
	if err != nil {
		t.Fatalf("batch with one failure should not abort: %v", err)
	}
	if !strings.Contains(message, "Failed: 1") {
		t.Errorf("message should report 1 failure, got %q", message)
	}
	data, err := os.ReadFile(logPath)
	if err != nil || !strings.Contains(string(data), "/sdcard/ok.txt") {
		t.Errorf("valid path should still have been pushed, log=%q err=%v", data, err)
	}
}
