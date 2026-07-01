package core

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// AppConfig holds the persistent configuration for ADBKit.
type AppConfig struct {
	AdbPath              string            `json:"adb_path"`
	FastbootPath         string            `json:"fastboot_path"`
	ScrcpyPath           string            `json:"scrcpy_path"`
	SetupCompleted       bool              `json:"setup_completed"`
	Theme                string            `json:"theme"`
	BinaryVersions       map[string]string `json:"binary_versions"`
	DeviceNicknames      map[string]string `json:"device_nicknames"`
	LogcatBufferLimit    int               `json:"logcat_buffer_limit"`
	ScrcpyPresets        []ScrcpyPreset    `json:"scrcpy_presets"`
	DefaultTerminalMode  string            `json:"default_terminal_mode"`
	AutoRefreshDevices   bool              `json:"auto_refresh_devices"`
	DeviceRefreshSeconds int               `json:"device_refresh_seconds"`
	AuditEnabled         bool              `json:"audit_enabled"`
}

const (
	ThemeDark  = "dark"
	ThemeLight = "light"

	DefaultLogcatBufferLimit    = 5000
	DefaultTerminalMode         = "adb-shell"
	DefaultDeviceRefreshSeconds = 8
)

// DefaultConfig returns a fresh config with empty paths.
func DefaultConfig() *AppConfig {
	return &AppConfig{
		Theme:                ThemeDark,
		BinaryVersions:       make(map[string]string),
		DeviceNicknames:      make(map[string]string),
		LogcatBufferLimit:    DefaultLogcatBufferLimit,
		ScrcpyPresets:        []ScrcpyPreset{},
		DefaultTerminalMode:  DefaultTerminalMode,
		AutoRefreshDevices:   true,
		DeviceRefreshSeconds: DefaultDeviceRefreshSeconds,
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
	if cfg.DefaultTerminalMode == "" {
		cfg.DefaultTerminalMode = DefaultTerminalMode
	}
	if cfg.DeviceRefreshSeconds <= 0 {
		cfg.DeviceRefreshSeconds = DefaultDeviceRefreshSeconds
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

// BinaryPaths holds resolved binary paths for command execution.
type BinaryPaths struct {
	Adb      string
	Fastboot string
	Scrcpy   string
}

// GetBinaryPaths returns a function that resolves binary paths from the current config.
// Empty config paths fall back to bare names so exec.LookPath handles discovery.
func GetBinaryPaths(cfg *AppConfig) func() BinaryPaths {
	return func() BinaryPaths {
		adb := cfg.AdbPath
		if adb == "" {
			adb = BinaryNameAdb
		}
		fastboot := cfg.FastbootPath
		if fastboot == "" {
			fastboot = BinaryNameFastboot
		}
		scrcpy := cfg.ScrcpyPath
		if scrcpy == "" {
			scrcpy = BinaryNameScrcpy
		}
		return BinaryPaths{Adb: adb, Fastboot: fastboot, Scrcpy: scrcpy}
	}
}
