package binary

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestValidatePackageCompleteness_RejectsIncompleteScrcpy(t *testing.T) {
	dir := t.TempDir()

	svc := NewService(dir)
	err := svc.validatePackageCompleteness(BinaryNameScrcpy, filepath.Join(dir, "scrcpy"))
	if err == nil {
		t.Fatal("expected error for missing scrcpy-server")
	}
	if !strings.Contains(err.Error(), "scrcpy-server") {
		t.Errorf("expected error to mention scrcpy-server, got %v", err)
	}
}

func TestValidatePackageCompleteness_AcceptsCompleteScrcpy(t *testing.T) {
	dir := t.TempDir()
	serverPath := filepath.Join(dir, "scrcpy-server")
	if err := os.WriteFile(serverPath, []byte("fake-server"), 0o600); err != nil {
		t.Fatal(err)
	}

	svc := NewService(dir)
	if err := svc.validatePackageCompleteness(BinaryNameScrcpy, filepath.Join(dir, "scrcpy")); err != nil {
		t.Errorf("expected complete scrcpy package to be accepted, got %v", err)
	}
}

func TestValidatePackageCompleteness_LinuxRequiresLib64(t *testing.T) {
	if runtime.GOOS != "linux" {
		t.Skip("linux-only test")
	}
	dir := t.TempDir()
	// No lib64 directory

	svc := NewService(dir)
	err := svc.validatePackageCompleteness(BinaryNameAdb, filepath.Join(dir, "adb"))
	if err == nil {
		t.Fatal("expected error for missing lib64 on Linux")
	}
	if !strings.Contains(err.Error(), "lib64") {
		t.Errorf("expected error to mention lib64, got %v", err)
	}
}

func TestValidatePackageCompleteness_WindowsDLLsAbsent(t *testing.T) {
	if runtime.GOOS != "windows" {
		t.Skip("windows-only test")
	}
	dir := t.TempDir()
	svc := NewService(dir)
	err := svc.validatePackageCompleteness(BinaryNameAdb, filepath.Join(dir, "adb.exe"))
	if err == nil {
		t.Fatal("expected error when Windows runtime DLLs are absent")
	}
	if !strings.Contains(err.Error(), "Windows runtime DLL") {
		t.Errorf("expected error to mention Windows runtime DLL, got %v", err)
	}
}
