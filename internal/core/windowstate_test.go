package core

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadWindowState_DefaultsWhenMissing(t *testing.T) {
	dataDir := t.TempDir()
	got := LoadWindowState(dataDir)
	if got != DefaultWindowState {
		t.Fatalf("LoadWindowState with missing file = %q, want %q", got, DefaultWindowState)
	}
}

func TestLoadWindowState_EmptyDir(t *testing.T) {
	got := LoadWindowState("")
	if got != DefaultWindowState {
		t.Fatalf("LoadWindowState(\"\") = %q, want %q", got, DefaultWindowState)
	}
}

func TestSaveAndLoadWindowState_RoundTrip(t *testing.T) {
	cases := []string{
		WindowStateMaximised,
		WindowStateNormal,
		WindowStateFullscreen,
	}
	for _, state := range cases {
		t.Run(state, func(t *testing.T) {
			dataDir := t.TempDir()
			if err := SaveWindowState(dataDir, state); err != nil {
				t.Fatalf("SaveWindowState: %v", err)
			}
			got := LoadWindowState(dataDir)
			if got != state {
				t.Fatalf("round-trip mismatch: got %q want %q", got, state)
			}
		})
	}
}

func TestSaveWindowState_RejectsEmptyDir(t *testing.T) {
	err := SaveWindowState("", WindowStateNormal)
	if err == nil {
		t.Fatal("expected error for empty dataDir")
	}
}

func TestSaveWindowState_NormalizesInvalidState(t *testing.T) {
	dataDir := t.TempDir()
	if err := SaveWindowState(dataDir, "garbage-state"); err != nil {
		t.Fatalf("SaveWindowState: %v", err)
	}
	got := LoadWindowState(dataDir)
	if got != DefaultWindowState {
		t.Fatalf("invalid input should normalize to default: got %q", got)
	}
}

func TestLoadWindowState_RecoversFromCorruptFile(t *testing.T) {
	dataDir := t.TempDir()
	path := filepath.Join(dataDir, WindowStateFileName)
	if err := os.WriteFile(path, []byte("{ not valid json"), 0o600); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	got := LoadWindowState(dataDir)
	if got != DefaultWindowState {
		t.Fatalf("corrupt file should fall back to default: got %q", got)
	}
}

func TestNormalizeWindowState(t *testing.T) {
	cases := map[string]string{
		WindowStateMaximised:  WindowStateMaximised,
		WindowStateNormal:     WindowStateNormal,
		WindowStateFullscreen: WindowStateFullscreen,
		"":                    DefaultWindowState,
		"bogus":               DefaultWindowState,
	}
	for input, want := range cases {
		if got := NormalizeWindowState(input); got != want {
			t.Errorf("NormalizeWindowState(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestSaveWindowState_AtomicWrite(t *testing.T) {
	dataDir := t.TempDir()
	if err := SaveWindowState(dataDir, WindowStateNormal); err != nil {
		t.Fatalf("SaveWindowState: %v", err)
	}
	// After successful save, the .tmp file must not exist.
	tmpPath := filepath.Join(dataDir, WindowStateFileName+".tmp")
	if _, err := os.Stat(tmpPath); !os.IsNotExist(err) {
		t.Fatalf("temp file should not remain after atomic write, stat err = %v", err)
	}
}
