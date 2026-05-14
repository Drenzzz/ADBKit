package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	if cfg.AdbPath != "" {
		t.Errorf("expected empty AdbPath, got %q", cfg.AdbPath)
	}
	if cfg.SetupCompleted {
		t.Error("expected SetupCompleted false")
	}
	if cfg.BinaryVersions == nil {
		t.Error("expected BinaryVersions to be initialized")
	}
}

func TestLoadConfig_MissingFile(t *testing.T) {
	dir := t.TempDir()
	cfg, err := LoadConfig(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !cfg.SetupCompleted {
		// default is false, which is correct
	}
	if cfg.BinaryVersions == nil {
		t.Error("expected BinaryVersions to be initialized")
	}
}

func TestLoadConfig_ValidJSON(t *testing.T) {
	dir := t.TempDir()
	data := []byte(`{
		"adb_path": "/usr/bin/adb",
		"fastboot_path": "/usr/bin/fastboot",
		"scrcpy_path": "/usr/bin/scrcpy",
		"setup_completed": true,
		"binary_versions": {"adb": "35.0.2"}
	}`)
	if err := os.WriteFile(filepath.Join(dir, "config.json"), data, 0o644); err != nil {
		t.Fatal(err)
	}

	cfg, err := LoadConfig(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AdbPath != "/usr/bin/adb" {
		t.Errorf("expected AdbPath /usr/bin/adb, got %q", cfg.AdbPath)
	}
	if !cfg.SetupCompleted {
		t.Error("expected SetupCompleted true")
	}
	if cfg.BinaryVersions["adb"] != "35.0.2" {
		t.Errorf("expected adb version 35.0.2, got %q", cfg.BinaryVersions["adb"])
	}
}

func TestLoadConfig_InvalidJSON(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "config.json"), []byte("{invalid"), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := LoadConfig(dir)
	if err == nil {
		t.Fatal("expected error for invalid JSON")
	}
}

func TestLoadConfig_NormalizesNilVersions(t *testing.T) {
	dir := t.TempDir()
	data := []byte(`{"adb_path": "/usr/bin/adb"}`)
	if err := os.WriteFile(filepath.Join(dir, "config.json"), data, 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := LoadConfig(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.BinaryVersions == nil {
		t.Error("expected BinaryVersions to be normalized to empty map")
	}
}

func TestSaveConfig(t *testing.T) {
	dir := t.TempDir()
	cfg := DefaultConfig()
	cfg.AdbPath = "/test/adb"
	cfg.SetupCompleted = true

	if err := SaveConfig(dir, cfg); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	data, err := os.ReadFile(filepath.Join(dir, "config.json"))
	if err != nil {
		t.Fatal(err)
	}

	var loaded AppConfig
	if err := json.Unmarshal(data, &loaded); err != nil {
		t.Fatal(err)
	}
	if loaded.AdbPath != "/test/adb" {
		t.Errorf("expected AdbPath /test/adb, got %q", loaded.AdbPath)
	}
	if !loaded.SetupCompleted {
		t.Error("expected SetupCompleted true after save")
	}
}
