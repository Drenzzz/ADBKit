package packagemgr

import (
	"ADBKit/internal/core"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const helloWorldAPK = "/tmp/opencode/apk-testdata/helloworld.apk"

func requireTestAPK(t *testing.T) string {
	t.Helper()
	if _, err := os.Stat(helloWorldAPK); err != nil {
		t.Skipf("test APK not available: %v", err)
	}
	return helloWorldAPK
}

func TestInspectAPK_ValidAPK(t *testing.T) {
	apkPath := requireTestAPK(t)
	svc := NewService(nil, nil, nil)

	preview, err := svc.InspectAPK(apkPath)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if preview.FileName != "helloworld.apk" {
		t.Errorf("FileName = %q", preview.FileName)
	}
	if preview.PackageName != "com.example.helloworld" {
		t.Errorf("PackageName = %q", preview.PackageName)
	}
	if preview.AppLabel != "HelloWorld" {
		t.Errorf("AppLabel = %q", preview.AppLabel)
	}
	if preview.SizeBytes <= 0 {
		t.Errorf("SizeBytes = %d, want > 0", preview.SizeBytes)
	}
	if preview.VersionCode == "" {
		t.Errorf("VersionCode is empty")
	}
}

func TestInspectAPK_EmptyPath(t *testing.T) {
	svc := NewService(nil, nil, nil)
	_, err := svc.InspectAPK("   ")
	if err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestInspectAPK_RejectsNonAPK(t *testing.T) {
	dir := t.TempDir()
	txtPath := filepath.Join(dir, "app.txt")
	if err := os.WriteFile(txtPath, []byte("not an apk"), 0o600); err != nil {
		t.Fatal(err)
	}

	svc := NewService(nil, nil, nil)
	_, err := svc.InspectAPK(txtPath)
	if err == nil {
		t.Fatal("expected error for non-APK extension")
	}
	opErr, ok := err.(*core.OperationError)
	if !ok {
		t.Fatalf("expected OperationError, got %T", err)
	}
	if opErr.Operation != "validate_apk_file" {
		t.Fatalf("operation = %q, want validate_apk_file", opErr.Operation)
	}
}

func TestInspectAPK_RejectsMissingFile(t *testing.T) {
	svc := NewService(nil, nil, nil)
	_, err := svc.InspectAPK(filepath.Join(t.TempDir(), "missing.apk"))
	if err == nil {
		t.Fatal("expected error for missing file")
	}
}

func TestInspectAPK_RejectsCorruptAPK(t *testing.T) {
	dir := t.TempDir()
	fakeAPK := filepath.Join(dir, "broken.apk")
	if err := os.WriteFile(fakeAPK, []byte(strings.Repeat("A", 512)), 0o600); err != nil {
		t.Fatal(err)
	}

	svc := NewService(nil, nil, nil)
	_, err := svc.InspectAPK(fakeAPK)
	if err == nil {
		t.Fatal("expected error for corrupt APK")
	}
}
