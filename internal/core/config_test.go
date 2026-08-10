package core

import (
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestLoadConfigKeepsScrcpyDefaultsForLegacyConfig(t *testing.T) {
	dataDir := t.TempDir()
	configPath := filepath.Join(dataDir, "config.json")
	if err := os.WriteFile(configPath, []byte(`{"theme":"dark"}`), 0o600); err != nil {
		t.Fatal(err)
	}

	config, err := LoadConfig(dataDir)
	if err != nil {
		t.Fatal(err)
	}

	if !reflect.DeepEqual(config.ScrcpyOptions, DefaultScrcpyOptions()) {
		t.Fatalf("legacy config options = %#v, want defaults %#v", config.ScrcpyOptions, DefaultScrcpyOptions())
	}
}

func TestScrcpyOptionsRoundTrip(t *testing.T) {
	dataDir := t.TempDir()
	expected := DefaultScrcpyOptions()
	expected.MaxSize = 1440
	expected.MaxFPS = 60
	expected.NoAudio = true

	config := DefaultConfig()
	config.ScrcpyOptions = expected
	if err := SaveConfig(dataDir, config); err != nil {
		t.Fatal(err)
	}

	loaded, err := LoadConfig(dataDir)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(loaded.ScrcpyOptions, expected) {
		t.Fatalf("loaded options = %#v, want %#v", loaded.ScrcpyOptions, expected)
	}

	data, err := os.ReadFile(filepath.Join(dataDir, "config.json"))
	if err != nil {
		t.Fatal(err)
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatal(err)
	}
	if _, ok := raw["scrcpy_options"]; !ok {
		t.Fatal("config.json does not contain scrcpy_options")
	}
}
