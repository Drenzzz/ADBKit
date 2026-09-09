//go:build windows

package core

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveDataDirUsesExecutableDirectoryOnWindows(t *testing.T) {
	executablePath, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}

	got, err := ResolveDataDir()
	if err != nil {
		t.Fatal(err)
	}
	if want := filepath.Dir(executablePath); got != want {
		t.Fatalf("ResolveDataDir() = %q, want %q", got, want)
	}
}
