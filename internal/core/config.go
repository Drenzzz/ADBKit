package core

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// AppConfig holds the persistent configuration for ADBKit.
type AppConfig struct {
	AdbPath           string            `json:"adb_path"`
	FastbootPath      string            `json:"fastboot_path"`
	ScrcpyPath        string            `json:"scrcpy_path"`
	SetupCompleted    bool              `json:"setup_completed"`
	Theme             string            `json:"theme"`
	BinaryVersions    map[string]string `json:"binary_versions"`
	DeviceNicknames   map[string]string `json:"device_nicknames"`
	LogcatBufferLimit int               `json:"logcat_buffer_limit"`
	ScrcpyPresets     []ScrcpyPreset    `json:"scrcpy_presets"`
}

const (
	ThemeDark  = "dark"
	ThemeLight = "light"

	DefaultLogcatBufferLimit = 5000
)

// DefaultConfig returns a fresh config with empty paths.
func DefaultConfig() *AppConfig {
	return &AppConfig{
		Theme:             ThemeDark,
		BinaryVersions:    make(map[string]string),
		DeviceNicknames:   make(map[string]string),
		LogcatBufferLimit: DefaultLogcatBufferLimit,
		ScrcpyPresets:     []ScrcpyPreset{},
	}
}

// LoadConfig reads config from disk, returning a default if missing.
func LoadConfig(dataDir string) (*AppConfig, error) {
	path := filepath.Join(dataDir, "config.json")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return DefaultConfig(), nil
		}
		return nil, NewOperationError("config", "failed to read config", err.Error(), true)
	}

	cfg := DefaultConfig()
	if err := json.Unmarshal(data, cfg); err != nil {
		return nil, NewOperationError("config", "failed to parse config", err.Error(), false)
	}
	if cfg.Theme == "" {
		cfg.Theme = ThemeDark
	}
	if cfg.BinaryVersions == nil {
		cfg.BinaryVersions = make(map[string]string)
	}
	if cfg.DeviceNicknames == nil {
		cfg.DeviceNicknames = make(map[string]string)
	}
	if cfg.LogcatBufferLimit <= 0 {
		cfg.LogcatBufferLimit = DefaultLogcatBufferLimit
	}
	if cfg.ScrcpyPresets == nil {
		cfg.ScrcpyPresets = []ScrcpyPreset{}
	}
	return cfg, nil
}

// SaveConfig persists the config to disk.
func SaveConfig(dataDir string, cfg *AppConfig) error {
	path := filepath.Join(dataDir, "config.json")
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return NewOperationError("config", "failed to marshal config", err.Error(), true)
	}
	return WriteFileAtomicWithMode(path, data, 0o600)
}
