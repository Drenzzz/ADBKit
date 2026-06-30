package core

import "testing"

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
		{"unrelated", false},
	}
	for _, tt := range tests {
		if got := IsSupportedBinaryName(tt.name); got != tt.want {
			t.Errorf("IsSupportedBinaryName(%q) = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestValidatePath_Empty(t *testing.T) {
	if err := ValidatePath(""); err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestValidatePath_NotExist(t *testing.T) {
	if err := ValidatePath("/nonexistent/path/that/does/not/exist"); err == nil {
		t.Fatal("expected error for nonexistent path")
	}
}

func TestValidatePath_Exists(t *testing.T) {
	dir := t.TempDir()
	if err := ValidatePath(dir); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestValidatePath_Traversal(t *testing.T) {
	cases := []string{
		"../etc/passwd",
		"/tmp/../etc/passwd",
		"../../etc/shadow",
		"..",
	}
	for _, c := range cases {
		if err := ValidatePath(c); err == nil {
			t.Errorf("expected error for traversal path %q", c)
		}
	}
}

func TestValidateFlashPartition_Empty(t *testing.T) {
	if err := ValidateFlashPartition(""); err == nil {
		t.Fatal("expected error for empty partition")
	}
}

func TestValidateFlashPartition_Disallowed(t *testing.T) {
	if err := ValidateFlashPartition("modem"); err == nil {
		t.Fatal("expected error for disallowed partition")
	}
}

func TestValidateFlashPartition_Allowed(t *testing.T) {
	for _, p := range []string{"boot", "system", "vendor", "vbmeta", "super", "userdata", "boot_a", "init_boot"} {
		if err := ValidateFlashPartition(p); err != nil {
			t.Errorf("ValidateFlashPartition(%q) unexpected error: %v", p, err)
		}
	}
}

func TestValidateFlashFile_Empty(t *testing.T) {
	if err := ValidateFlashFile(""); err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestValidateFlashFile_WrongExtension(t *testing.T) {
	if err := ValidateFlashFile("/tmp/test.zip"); err == nil {
		t.Fatal("expected error for .zip file")
	}
}

func TestValidateFlashFile_OK(t *testing.T) {
	dir := t.TempDir()
	f := dir + "/boot.img"
	if err := writeFileForTest(f); err != nil {
		t.Fatal(err)
	}
	if err := ValidateFlashFile(f); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestValidateFlashFile_BinExtension(t *testing.T) {
	dir := t.TempDir()
	f := dir + "/modem.bin"
	if err := writeFileForTest(f); err != nil {
		t.Fatal(err)
	}
	if err := ValidateFlashFile(f); err != nil {
		t.Fatalf("unexpected error for .bin: %v", err)
	}
}

func TestValidateSideloadFile_Empty(t *testing.T) {
	if err := ValidateSideloadFile(""); err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestValidateSideloadFile_WrongExtension(t *testing.T) {
	if err := ValidateSideloadFile("/tmp/test.img"); err == nil {
		t.Fatal("expected error for .img file")
	}
}

func TestValidateSideloadFile_OK(t *testing.T) {
	dir := t.TempDir()
	f := dir + "/update.zip"
	if err := writeFileForTest(f); err != nil {
		t.Fatal(err)
	}
	if err := ValidateSideloadFile(f); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
