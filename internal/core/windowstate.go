package core

import (
	"encoding/json"
	"os"
	"path/filepath"
)

const (
	WindowStateMaximised  = "maximised"
	WindowStateNormal     = "normal"
	WindowStateFullscreen = "fullscreen"
)

// DefaultWindowState matches the prior hard-coded behaviour in main.go so
// existing users see no change on first run after upgrade.
const DefaultWindowState = WindowStateMaximised

type windowStateFile struct {
	State string `json:"state"`
}

// WindowStateFileName is the small JSON file persisted at startup so main.go
// can read the preferred window state synchronously before creating the
// WebviewWindow. Kept separate from config.json so the App binding's config
// lifecycle (which depends on ServiceStartup) is not on the critical path.
const WindowStateFileName = "window.json"

// LoadWindowState reads the persisted window state from dataDir. Returns
// DefaultWindowState when the file is missing or invalid (first run, broken
// permission, etc.) so the app falls back to the previous behaviour.
func LoadWindowState(dataDir string) string {
	if dataDir == "" {
		return DefaultWindowState
	}
	data, err := os.ReadFile(filepath.Join(dataDir, WindowStateFileName))
	if err != nil {
		return DefaultWindowState
	}
	var wsf windowStateFile
	if err := json.Unmarshal(data, &wsf); err != nil {
		return DefaultWindowState
	}
	switch wsf.State {
	case WindowStateMaximised, WindowStateNormal, WindowStateFullscreen:
		return wsf.State
	default:
		return DefaultWindowState
	}
}

// SaveWindowState writes the chosen state atomically (write-then-rename) so
// a half-written file cannot leave main.go reading a truncated value on next
// launch. Empty input is normalized to DefaultWindowState.
func SaveWindowState(dataDir, state string) error {
	if dataDir == "" {
		return NewOperationError("save_window_state", "data directory is empty", "", false)
	}
	if state != WindowStateMaximised && state != WindowStateNormal && state != WindowStateFullscreen {
		state = DefaultWindowState
	}
	if err := os.MkdirAll(dataDir, 0o700); err != nil {
		return NewOperationError("save_window_state", "failed to create data directory", err.Error(), true)
	}
	payload, err := json.MarshalIndent(windowStateFile{State: state}, "", "  ")
	if err != nil {
		return NewOperationError("save_window_state", "failed to marshal state", err.Error(), false)
	}
	tmpPath := filepath.Join(dataDir, WindowStateFileName+".tmp")
	finalPath := filepath.Join(dataDir, WindowStateFileName)
	if err := os.WriteFile(tmpPath, payload, 0o600); err != nil {
		return NewOperationError("save_window_state", "failed to write state file", err.Error(), true)
	}
	if err := os.Rename(tmpPath, finalPath); err != nil {
		os.Remove(tmpPath)
		return NewOperationError("save_window_state", "failed to finalize state file", err.Error(), true)
	}
	return nil
}

// NormalizeWindowState returns a valid state, falling back to DefaultWindowState.
func NormalizeWindowState(state string) string {
	switch state {
	case WindowStateMaximised, WindowStateNormal, WindowStateFullscreen:
		return state
	default:
		return DefaultWindowState
	}
}
