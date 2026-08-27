package binary

import (
	"ADBKit/internal/core"
	"strings"
	"testing"
)

func TestService_Detect_RejectsUnsupportedName(t *testing.T) {
	svc := NewService(t.TempDir())
	info := svc.Detect("not-a-binary", "")
	if info.Status != BinaryInvalid {
		t.Errorf("expected invalid status for unsupported name, got %v", info.Status)
	}
	if info.Reason == "" {
		t.Error("expected reason to be populated")
	}
}

func TestService_Detect_ReturnsMissingWhenNoCandidates(t *testing.T) {
	t.Setenv("PATH", t.TempDir())
	svc := NewService(t.TempDir())
	svc.commonPathsOverride = func(string) []string { return nil }
	info := svc.Detect(BinaryNameAdb, "")
	if info.Status != BinaryMissing {
		t.Errorf("expected missing status, got %v", info.Status)
	}
	if info.Name != BinaryNameAdb {
		t.Errorf("expected name %q, got %q", BinaryNameAdb, info.Name)
	}
}

func TestService_SetCustomBinary_RejectsInvalidPath(t *testing.T) {
	svc := NewService(t.TempDir())
	cfg := &core.AppConfig{}
	err := svc.SetCustomBinary(cfg, BinaryNameAdb, "/nonexistent/adb")
	if err == nil {
		t.Fatal("expected error for nonexistent path")
	}
	if !strings.Contains(err.Error(), "binary path is invalid") {
		t.Errorf("expected friendly error, got %v", err)
	}
}

func TestService_SetCustomBinary_RejectsWrongBinaryName(t *testing.T) {
	svc := NewService(t.TempDir())
	cfg := &core.AppConfig{}
	err := svc.SetCustomBinary(cfg, BinaryNameAdb, "/bin/ls")
	if err == nil {
		t.Fatal("expected error for wrong binary name")
	}
}

func TestService_ClearCustomBinary_RejectsUnsupportedName(t *testing.T) {
	svc := NewService(t.TempDir())
	cfg := &core.AppConfig{}
	err := svc.ClearCustomBinary(cfg, "not-a-binary")
	if err == nil {
		t.Fatal("expected error for unsupported name")
	}
	if !strings.Contains(err.Error(), "unsupported binary name") {
		t.Errorf("expected friendly error, got %v", err)
	}
}

func TestService_CompleteSetup_RejectsWhenNotReady(t *testing.T) {
	svc := NewService(t.TempDir())
	cfg := &core.AppConfig{}
	_, err := svc.CompleteSetup(cfg)
	if err == nil {
		t.Fatal("expected error when binaries not ready")
	}
	if !strings.Contains(err.Error(), "required binaries are not ready") {
		t.Errorf("expected friendly error, got %v", err)
	}
}

func TestService_RevalidateConfig_DemotesSetupCompletedWhenBinaryInvalid(t *testing.T) {
	svc := NewService(t.TempDir())
	cfg := &core.AppConfig{
		AdbPath:        "/nonexistent/adb",
		FastbootPath:   "/nonexistent/fastboot",
		ScrcpyPath:     "/nonexistent/scrcpy",
		SetupCompleted: true,
		BinaryVersions: map[string]string{
			BinaryNameAdb:      "1.0",
			BinaryNameFastboot: "1.0",
			BinaryNameScrcpy:   "1.0",
		},
	}
	result := svc.RevalidateConfig(cfg)
	if cfg.SetupCompleted {
		t.Fatal("expected setup_completed to be reset to false")
	}
	if !result.Changed {
		t.Error("expected Changed=true when setup_completed is demoted")
	}
	if result.Status == nil {
		t.Fatal("expected status to be populated")
	}
}

func TestService_GetManagedBinaryDir(t *testing.T) {
	dir := t.TempDir()
	svc := NewService(dir)
	got := svc.GetManagedBinaryDir()
	if got == "" {
		t.Fatal("expected managed dir to be non-empty")
	}
	if !strings.HasSuffix(got, "bin") {
		t.Errorf("expected path to end with 'bin', got %q", got)
	}
}

func TestService_ListManagedBinaries_EmptyDir(t *testing.T) {
	svc := NewService(t.TempDir())
	binaries, err := svc.ListManagedBinaries()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(binaries) != 0 {
		t.Errorf("expected empty list, got %d entries", len(binaries))
	}
}

func TestAssignBinaryPath(t *testing.T) {
	cfg := &core.AppConfig{}
	assignBinaryPath(cfg, BinaryNameAdb, "/usr/bin/adb")
	if cfg.AdbPath != "/usr/bin/adb" {
		t.Errorf("expected adb_path to be set, got %q", cfg.AdbPath)
	}
	assignBinaryPath(cfg, BinaryNameFastboot, "/usr/bin/fastboot")
	if cfg.FastbootPath != "/usr/bin/fastboot" {
		t.Errorf("expected fastboot_path to be set, got %q", cfg.FastbootPath)
	}
	assignBinaryPath(cfg, BinaryNameScrcpy, "/usr/bin/scrcpy")
	if cfg.ScrcpyPath != "/usr/bin/scrcpy" {
		t.Errorf("expected scrcpy_path to be set, got %q", cfg.ScrcpyPath)
	}
}
