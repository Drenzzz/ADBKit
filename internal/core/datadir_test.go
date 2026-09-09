package core

import (
	"path/filepath"
	"testing"
)

func TestExecutableDataDir(t *testing.T) {
	executablePath := filepath.Join(t.TempDir(), "ADBKit.exe")

	got, err := executableDataDir(executablePath)
	if err != nil {
		t.Fatalf("executableDataDir: %v", err)
	}
	if want := filepath.Dir(executablePath); got != want {
		t.Fatalf("executableDataDir() = %q, want %q", got, want)
	}
}

func TestExecutableDataDirRejectsEmptyPath(t *testing.T) {
	if _, err := executableDataDir(""); err == nil {
		t.Fatal("expected empty executable path to be rejected")
	}
}
