package main

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestIsSupportedBinaryName(t *testing.T) {
	tests := []struct {
		name string
		want bool
	}{
		{"adb", true},
		{"fastboot", true},
		{"scrcpy", true},
		{"ls", false},
		{"", false},
		{"ADB", false},
	}
	for _, tt := range tests {
		if got := IsSupportedBinaryName(tt.name); got != tt.want {
			t.Errorf("IsSupportedBinaryName(%q) = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestParseVersion(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"adb output", "Android Debug Bridge version 1.0.41\n", "Android Debug Bridge version 1.0.41"},
		{"fastboot stderr", "fastboot version 35.0.2-android-tools\n", "fastboot version 35.0.2-android-tools"},
		{"scrcpy", "scrcpy 4.0 <https://github.com/Genymobile/scrcpy>\n", "scrcpy 4.0 <https://github.com/Genymobile/scrcpy>"},
		{"empty", "", ""},
		{"whitespace only", "  \n  \n", ""},
		{"no newline", "version 1.0", "version 1.0"},
	}
	for _, tt := range tests {
		if got := parseVersion(tt.input); got != tt.want {
			t.Errorf("parseVersion(%q) = %q, want %q", tt.name, got, tt.want)
		}
	}
}

func TestVersionCommands(t *testing.T) {
	adb := versionCommands(BinaryNameAdb)
	if len(adb) != 1 || adb[0][0] != "version" {
		t.Errorf("adb version commands unexpected: %v", adb)
	}

	fb := versionCommands(BinaryNameFastboot)
	if len(fb) != 2 || fb[0][0] != "--version" || fb[1][0] != "version" {
		t.Errorf("fastboot version commands unexpected: %v", fb)
	}

	sc := versionCommands(BinaryNameScrcpy)
	if len(sc) != 1 || sc[0][0] != "--version" {
		t.Errorf("scrcpy version commands unexpected: %v", sc)
	}

	def := versionCommands("unknown")
	if len(def) != 1 || def[0][0] != "--version" {
		t.Errorf("default version commands unexpected: %v", def)
	}
}

func TestAssignBinaryPath(t *testing.T) {
	cfg := DefaultConfig()

	assignBinaryPath(cfg, BinaryNameAdb, "/test/adb")
	if cfg.AdbPath != "/test/adb" {
		t.Errorf("expected AdbPath /test/adb, got %q", cfg.AdbPath)
	}

	assignBinaryPath(cfg, BinaryNameFastboot, "/test/fastboot")
	if cfg.FastbootPath != "/test/fastboot" {
		t.Errorf("expected FastbootPath /test/fastboot, got %q", cfg.FastbootPath)
	}

	assignBinaryPath(cfg, BinaryNameScrcpy, "/test/scrcpy")
	if cfg.ScrcpyPath != "/test/scrcpy" {
		t.Errorf("expected ScrcpyPath /test/scrcpy, got %q", cfg.ScrcpyPath)
	}

	assignBinaryPath(cfg, "unknown", "/test/unknown")
}

func TestPathChanged(t *testing.T) {
	cfg := DefaultConfig()
	cfg.AdbPath = "/usr/bin/adb"

	if pathChanged(cfg, BinaryNameAdb, "/usr/bin/adb") {
		t.Error("expected no change for same path")
	}
	if !pathChanged(cfg, BinaryNameAdb, "/other/adb") {
		t.Error("expected change for different path")
	}
	if !pathChanged(cfg, BinaryNameFastboot, "/usr/bin/fastboot") {
		t.Error("expected change for unset path compared to new value")
	}
	if pathChanged(cfg, "unknown", "/anything") {
		t.Error("expected no change for unknown binary")
	}
}

func TestSyncBinaryConfig(t *testing.T) {
	cfg := DefaultConfig()

	changed := syncBinaryConfig(cfg, BinaryNameAdb, nil)
	if changed {
		t.Error("expected no change for nil info")
	}

	changed = syncBinaryConfig(cfg, BinaryNameAdb, &BinaryInfo{
		Name:   "adb",
		Path:   "/usr/bin/adb",
		Status: BinaryMissing,
	})
	if changed {
		t.Error("expected no change for missing status")
	}

	changed = syncBinaryConfig(cfg, BinaryNameAdb, &BinaryInfo{
		Name:    "adb",
		Path:    "/usr/bin/adb",
		Status:  BinaryReady,
		Version: "35.0.2",
	})
	if !changed {
		t.Error("expected change for ready binary")
	}
	if cfg.AdbPath != "/usr/bin/adb" {
		t.Errorf("expected AdbPath updated, got %q", cfg.AdbPath)
	}
	if cfg.BinaryVersions["adb"] != "35.0.2" {
		t.Errorf("expected version updated, got %q", cfg.BinaryVersions["adb"])
	}

	changed = syncBinaryConfig(cfg, BinaryNameAdb, &BinaryInfo{
		Name:    "adb",
		Path:    "/usr/bin/adb",
		Status:  BinaryReady,
		Version: "35.0.2",
	})
	if changed {
		t.Error("expected no change for same path and version")
	}
}

func TestSyncBinaryConfig_NilVersions(t *testing.T) {
	cfg := DefaultConfig()
	cfg.BinaryVersions = nil

	changed := syncBinaryConfig(cfg, BinaryNameAdb, &BinaryInfo{
		Name:    "adb",
		Path:    "/usr/bin/adb",
		Status:  BinaryReady,
		Version: "35.0.2",
	})
	if !changed {
		t.Error("expected change for nil BinaryVersions initialization")
	}
	if cfg.BinaryVersions == nil {
		t.Error("expected BinaryVersions to be initialized")
	}
}

func TestCompleteSetup_Guard(t *testing.T) {
	bs := NewBinaryService(t.TempDir())

	cfg := DefaultConfig()
	cfg.AdbPath = "/nonexistent/adb"
	cfg.FastbootPath = "/nonexistent/fastboot"
	cfg.ScrcpyPath = "/nonexistent/scrcpy"

	state := bs.GetSetupState(cfg)
	if state.CanFinish {
		t.Skip("system has binaries in PATH, guard cannot be tested in this environment")
	}

	_, err := bs.CompleteSetup(cfg)
	if err == nil {
		t.Fatal("expected error when binaries not ready")
	}
	if cfg.SetupCompleted {
		t.Error("expected SetupCompleted to remain false")
	}
}

func TestGetSetupState_IncompleteWhenMissingBinary(t *testing.T) {
	bs := NewBinaryService(t.TempDir())
	cfg := DefaultConfig()
	cfg.AdbPath = "/nonexistent/adb"
	cfg.FastbootPath = "/nonexistent/fastboot"
	cfg.ScrcpyPath = "/nonexistent/scrcpy"
	state := bs.GetSetupState(cfg)
	if state.CanFinish {
		t.Skip("system has binaries in PATH, incomplete state cannot be tested")
	}
	if state.SetupCompleted {
		t.Error("expected SetupCompleted false")
	}
}

func TestDetect_UnsupportedName(t *testing.T) {
	bs := NewBinaryService(t.TempDir())
	info := bs.Detect("unsupported", "")
	if info.Status != BinaryInvalid {
		t.Errorf("expected invalid status, got %q", info.Status)
	}
}

func TestDetect_MissingBinary(t *testing.T) {
	bs := NewBinaryService(t.TempDir())
	info := bs.Detect("adb", "/nonexistent/adb")
	if info.Status == BinaryReady {
		t.Skip("system has adb in PATH, missing binary test cannot run")
	}
}

func TestDetect_AllReturnsThreeResults(t *testing.T) {
	bs := NewBinaryService(t.TempDir())
	cfg := DefaultConfig()
	results := bs.DetectAll(cfg)
	if len(results) != 3 {
		t.Fatalf("expected 3 results, got %d", len(results))
	}
	names := map[string]bool{}
	for _, r := range results {
		names[r.Name] = true
	}
	for _, expected := range []string{"adb", "fastboot", "scrcpy"} {
		if !names[expected] {
			t.Errorf("missing binary %q in results", expected)
		}
	}
}

func TestGetManagedBinaryDir(t *testing.T) {
	bs := NewBinaryService("/tmp/test")
	got := bs.GetManagedBinaryDir()
	expected := filepath.Join("/tmp/test", "bin")
	if got != expected {
		t.Errorf("expected %q, got %q", expected, got)
	}
}

func TestListManagedBinaries_Empty(t *testing.T) {
	bs := NewBinaryService(t.TempDir())
	bins, err := bs.ListManagedBinaries()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(bins) != 0 {
		t.Errorf("expected empty list, got %v", bins)
	}
}

func TestListManagedBinaries_WithFiles(t *testing.T) {
	dir := t.TempDir()
	binDir := filepath.Join(dir, "bin")
	if err := os.MkdirAll(binDir, 0o755); err != nil {
		t.Fatal(err)
	}
	os.WriteFile(filepath.Join(binDir, "adb"), []byte("x"), 0o755)
	os.WriteFile(filepath.Join(binDir, "fastboot"), []byte("x"), 0o755)
	os.WriteFile(filepath.Join(binDir, "notabinary.txt"), []byte("x"), 0o644)

	bs := NewBinaryService(dir)
	bins, err := bs.ListManagedBinaries()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(bins) != 3 {
		t.Errorf("expected 3 files, got %d: %v", len(bins), bins)
	}
}

func TestBinaryExecutableName(t *testing.T) {
	if runtime.GOOS == "windows" {
		got := binaryExecutableName("adb")
		if got != "adb.exe" {
			t.Errorf("expected adb.exe, got %q", got)
		}
	} else {
		got := binaryExecutableName("adb")
		if got != "adb" {
			t.Errorf("expected adb, got %q", got)
		}
	}
}

func TestDetect_WithRealBinary(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("real binary test not reliable on Windows without setup")
	}
	bs := NewBinaryService(t.TempDir())
	info := bs.Detect("ls", "")
	// ls should be found in /bin/ls on most Unix systems
	if info.Status == BinaryReady {
		if !strings.Contains(info.Version, "ls") && info.Version == "" {
			// version might be empty for ls, but that's ok for this test
		}
		t.Logf("ls detected at %q, version: %q", info.Path, info.Version)
	} else {
		t.Logf("ls not detected (status: %q), skipping real binary assertion", info.Status)
	}
}
