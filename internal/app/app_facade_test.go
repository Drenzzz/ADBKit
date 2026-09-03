package app

import (
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// newTestApp builds a minimum App wired to a temporary data directory so that
// binding-facade methods can be exercised end-to-end without touching a real
// Wails application. Audit log is left nil; auditAction/auditVoidAction both
// guard on nil cfg / nil log.
func newTestApp(t *testing.T) (*App, string) {
	t.Helper()
	dataDir := t.TempDir()
	a := &App{
		dataDir: dataDir,
		cfg:     core.DefaultConfig(),
		binSvc:  binary.NewService(dataDir),
	}
	return a, dataDir
}

func TestSetCustomBinary_RejectsUnsupportedName(t *testing.T) {
	a, _ := newTestApp(t)

	err := a.SetCustomBinary("totally-fake", "/usr/bin/foo")
	if err == nil {
		t.Fatal("expected error for unsupported binary name")
	}
	if !strings.Contains(err.Error(), "unsupported binary name") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestSetCustomBinary_RejectsBrokenPath(t *testing.T) {
	a, _ := newTestApp(t)

	err := a.SetCustomBinary("adb", "/nonexistent/path/adb")
	if err == nil {
		t.Fatal("expected error for invalid custom path")
	}
}

func TestClearCustomBinary_RejectsUnsupportedName(t *testing.T) {
	a, _ := newTestApp(t)

	err := a.ClearCustomBinary("not-a-real-binary")
	if err == nil {
		t.Fatal("expected error for unsupported binary name")
	}
}

func TestClearCustomBinary_HappyPath(t *testing.T) {
	a, _ := newTestApp(t)

	a.cfg.AdbPath = "/tmp/adb"
	if err := a.ClearCustomBinary("adb"); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if a.cfg.AdbPath != "" {
		t.Fatalf("expected adb path cleared, got %q", a.cfg.AdbPath)
	}
}

func TestCompleteSetup_RejectsWhenNotReady(t *testing.T) {
	a, _ := newTestApp(t)

	_, err := a.CompleteSetup()
	if err == nil {
		t.Fatal("expected error when binaries are not ready")
	}
	if !strings.Contains(err.Error(), "required binaries are not ready") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestRetryBinaryDetection_HappyPath(t *testing.T) {
	a, _ := newTestApp(t)

	status, err := a.RetryBinaryDetection()
	if err != nil {
		t.Fatalf("RetryBinaryDetection returned error: %v", err)
	}
	if status == nil {
		t.Fatal("expected non-nil status")
	}
	if status.Ready {
		t.Fatal("Ready should be false in test env with no real binaries")
	}
}

func TestGetManagedBinaryDir(t *testing.T) {
	a, dataDir := newTestApp(t)

	got := a.GetManagedBinaryDir()
	want := filepath.Join(dataDir, "bin")
	if got != want {
		t.Fatalf("GetManagedBinaryDir() = %q, want %q", got, want)
	}
}

func TestListManagedBinaries_EmptyDir(t *testing.T) {
	a, _ := newTestApp(t)

	binaries, err := a.ListManagedBinaries()
	if err != nil {
		t.Fatalf("ListManagedBinaries returned error: %v", err)
	}
	if len(binaries) != 0 {
		t.Fatalf("expected empty list, got %v", binaries)
	}
}

func TestGetCapabilities_FullShape(t *testing.T) {
	a, _ := newTestApp(t)

	caps := a.GetCapabilities()

	// Env-agnostic: just assert the keys exist with bool values.
	// Whether the host machine has real adb/fastboot/scrcpy in PATH is
	// outside the unit-test contract; we cover detection in binary tests.
	requiredKeys := []string{
		"adbAvailable",
		"fastbootAvailable",
		"scrcpyAvailable",
		"setupCompleted",
		"wirelessPairingSupported",
		"clipboardSyncSupported",
		"audioCaptureSupported",
	}
	for _, key := range requiredKeys {
		v, ok := caps[key]
		if !ok {
			t.Errorf("GetCapabilities missing key %q", key)
			continue
		}
		_ = v // bool-typed by signature; value is environment-dependent
	}
}

func TestGetBinaryStatus_HappyPath(t *testing.T) {
	a, _ := newTestApp(t)

	status := a.GetBinaryStatus()
	if status == nil {
		t.Fatal("expected non-nil status")
	}
	if status.Adb == nil || status.Fastboot == nil || status.Scrcpy == nil {
		t.Fatal("all three binary info slots must be populated")
	}
	// Ready value is environment-dependent (depends on PATH containing real
	// binaries). Don't assert it here.
}

func TestGetSetupState_HappyPath(t *testing.T) {
	a, _ := newTestApp(t)

	state := a.GetSetupState()
	if state == nil {
		t.Fatal("expected non-nil state")
	}
	// CanFinish value is environment-dependent (real adb in PATH can flip it
	// true). Just assert the struct shape is populated.
	if state.Status == nil {
		t.Error("Status should be populated")
	}
}

func TestSaveConfigPersistsFile(t *testing.T) {
	a, dataDir := newTestApp(t)
	a.cfg.AdbPath = "/custom/adb"
	if err := core.SaveConfig(dataDir, a.cfg); err != nil {
		t.Fatalf("SaveConfig: %v", err)
	}

	loaded, err := core.LoadConfig(dataDir)
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}
	if loaded.AdbPath != "/custom/adb" {
		t.Fatalf("round-trip mismatch: got %q", loaded.AdbPath)
	}

	// Sanity: file exists at expected location
	if _, err := os.Stat(filepath.Join(dataDir, "config.json")); err != nil {
		t.Fatalf("config.json missing: %v", err)
	}
}
