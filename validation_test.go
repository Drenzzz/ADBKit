package main

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestValidatePath_Empty(t *testing.T) {
	err := ValidatePath("")
	if err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestValidatePath_NotExist(t *testing.T) {
	err := ValidatePath("/nonexistent/path/that/does/not/exist")
	if err == nil {
		t.Fatal("expected error for nonexistent path")
	}
}

func TestValidatePath_Exists(t *testing.T) {
	dir := t.TempDir()
	if err := ValidatePath(dir); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestValidateExecutable_IsDir(t *testing.T) {
	dir := t.TempDir()
	err := ValidateExecutable(dir)
	if err == nil {
		t.Fatal("expected error for directory")
	}
}

func TestValidateExecutable_NotExist(t *testing.T) {
	err := ValidateExecutable("/nonexistent/binary")
	if err == nil {
		t.Fatal("expected error for nonexistent file")
	}
}

func TestValidateExecutable_NoPerm(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("permission check not applicable on Windows")
	}
	dir := t.TempDir()
	f := filepath.Join(dir, "testbin")
	if err := os.WriteFile(f, []byte("#!/bin/sh\necho test"), 0o644); err != nil {
		t.Fatal(err)
	}
	err := ValidateExecutable(f)
	if err == nil {
		t.Fatal("expected error for non-executable file")
	}
}

func TestValidateExecutable_OK(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("permission check not applicable on Windows")
	}
	dir := t.TempDir()
	f := filepath.Join(dir, "testbin")
	if err := os.WriteFile(f, []byte("#!/bin/sh\necho test"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := ValidateExecutable(f); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestValidateBinaryExecutable_UnsupportedName(t *testing.T) {
	err := ValidateBinaryExecutable("unsupported", "/some/path")
	if err == nil {
		t.Fatal("expected error for unsupported binary name")
	}
}

func TestValidateBinaryExecutable_NameMismatch(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("permission check not applicable on Windows")
	}
	dir := t.TempDir()
	f := filepath.Join(dir, "wrongname")
	if err := os.WriteFile(f, []byte("#!/bin/sh\necho test"), 0o755); err != nil {
		t.Fatal(err)
	}
	err := ValidateBinaryExecutable("adb", f)
	if err == nil {
		t.Fatal("expected error for name mismatch")
	}
}

func TestValidateBinaryExecutable_OK(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("permission check not applicable on Windows")
	}
	dir := t.TempDir()
	f := filepath.Join(dir, "adb")
	if err := os.WriteFile(f, []byte("#!/bin/sh\necho test"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := ValidateBinaryExecutable("adb", f); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestEnsureDir(t *testing.T) {
	dir := t.TempDir()
	nested := filepath.Join(dir, "a", "b", "c")
	if err := EnsureDir(nested); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	info, err := os.Stat(nested)
	if err != nil {
		t.Fatal(err)
	}
	if !info.IsDir() {
		t.Error("expected directory to be created")
	}
}

func TestParentDir(t *testing.T) {
	got := ParentDir("/a/b/c/file.txt")
	if got != "/a/b/c" {
		t.Errorf("expected /a/b/c, got %q", got)
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

func TestValidateFlashPartition_CaseInsensitive(t *testing.T) {
	if err := ValidateFlashPartition("BOOT"); err != nil {
		t.Errorf("expected partition names to be case-insensitive, got: %v", err)
	}
}

func TestValidateFlashFile_Empty(t *testing.T) {
	if err := ValidateFlashFile(""); err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestValidateFlashFile_WrongExtension(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "test.zip")
	os.WriteFile(f, []byte("data"), 0o644)
	if err := ValidateFlashFile(f); err == nil {
		t.Fatal("expected error for .zip file")
	}
}

func TestValidateFlashFile_IsDir(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "boot.img")
	os.Mkdir(f, 0o755)
	if err := ValidateFlashFile(f); err == nil {
		t.Fatal("expected error for directory")
	}
}

func TestValidateFlashFile_OK(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "boot.img")
	os.WriteFile(f, []byte("fake image"), 0o644)
	if err := ValidateFlashFile(f); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestValidateFlashFile_BinExtension(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "modem.bin")
	os.WriteFile(f, []byte("fake binary"), 0o644)
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
	dir := t.TempDir()
	f := filepath.Join(dir, "test.img")
	os.WriteFile(f, []byte("data"), 0o644)
	if err := ValidateSideloadFile(f); err == nil {
		t.Fatal("expected error for .img file")
	}
}

func TestValidateSideloadFile_IsDir(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "rom.zip")
	os.Mkdir(f, 0o755)
	if err := ValidateSideloadFile(f); err == nil {
		t.Fatal("expected error for directory")
	}
}

func TestValidateSideloadFile_OK(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "update.zip")
	os.WriteFile(f, []byte("fake zip"), 0o644)
	if err := ValidateSideloadFile(f); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
