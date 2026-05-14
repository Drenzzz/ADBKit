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
