package dialog

import (
	"strings"
	"testing"
)

// dialog requires a running Wails application to invoke the OS-native dialog
// at runtime. The service intentionally does not inject a dialog abstraction
// (would balloon beyond 50 LOC of mock surface) so the modal paths are covered
// by manual smoke tests. These unit tests pin down the deterministic fail-fast
// branches that MUST be exercised before any Wails runtime is reachable.

func TestSelectBinaryFile_RejectsInvalidContext(t *testing.T) {
	s := &Service{} // ctx nil on purpose

	_, err := s.SelectBinaryFile("adb")
	if err == nil {
		t.Fatal("expected error when context is uninitialized")
	}
	if !strings.Contains(err.Error(), "application context is not initialized") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestSelectPlatformToolsDirectory_RejectsInvalidContext(t *testing.T) {
	s := &Service{}

	_, err := s.SelectPlatformToolsDirectory()
	if err == nil {
		t.Fatal("expected error when context is uninitialized")
	}
	if !strings.Contains(err.Error(), "application context is not initialized") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestSelectScrcpyDirectory_RejectsInvalidContext(t *testing.T) {
	s := &Service{}

	_, err := s.SelectScrcpyDirectory()
	if err == nil {
		t.Fatal("expected error when context is uninitialized")
	}
	if !strings.Contains(err.Error(), "application context is not initialized") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestSelectApkFile_RejectsInvalidContext(t *testing.T) {
	s := &Service{}

	_, err := s.SelectApkFile()
	if err == nil {
		t.Fatal("expected error when context is uninitialized")
	}
}

func TestSelectSaveFile_RejectsInvalidContext(t *testing.T) {
	s := &Service{}

	_, err := s.SelectSaveFile("file.txt")
	if err == nil {
		t.Fatal("expected error when context is uninitialized")
	}
}

func TestSetContext(t *testing.T) {
	s := &Service{}
	if s.ctx != nil {
		t.Fatal("ctx should start nil")
	}
	s.SetContext(nil) // allow explicitly clearing
	if s.ctx != nil {
		t.Fatal("SetContext(nil) should accept nil")
	}
}

