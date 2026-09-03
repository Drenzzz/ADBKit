package core

import (
	"os"
	"path/filepath"
	"runtime"
)

// ResolveDataDir returns the per-OS application data directory used by both
// the App service (during ServiceStartup) and main.go (synchronously, before
// Wails bootstraps). The directories follow convention:
//
//	Linux   → $XDG_DATA_HOME/adbkit or $HOME/.local/share/adbkit
//	Windows → %APPDATA%\adbkit
//	macOS   → ~/Library/Application Support/adbkit
func ResolveDataDir() (string, error) {
	switch runtime.GOOS {
	case "linux":
		base := os.Getenv("XDG_DATA_HOME")
		if base == "" {
			home, err := os.UserHomeDir()
			if err != nil {
				return "", err
			}
			base = filepath.Join(home, ".local", "share")
		}
		return filepath.Join(base, "adbkit"), nil
	case "windows":
		base := os.Getenv("APPDATA")
		if base != "" {
			return filepath.Join(base, "adbkit"), nil
		}
	case "darwin":
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, "Library", "Application Support", "adbkit"), nil
	}

	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "adbkit"), nil
}
