package binary

import (
	"ADBKit/internal/core"
	"os"
	"path/filepath"
)

func joinManaged(dataDir string) string {
	return filepath.Join(dataDir, "bin")
}

func joinManagedPath(dataDir, name string) string {
	switch name {
	case core.BinaryNameAdb, core.BinaryNameFastboot:
		return filepath.Join(dataDir, "bin", "platform-tools", core.BinaryExecutableName(name))
	case core.BinaryNameScrcpy:
		return filepath.Join(dataDir, "bin", "scrcpy", core.BinaryExecutableName(name))
	default:
		return filepath.Join(dataDir, "bin", core.BinaryExecutableName(name))
	}
}

func osMkdirAll(path string) error {
	return os.MkdirAll(path, 0o700)
}

func osReadDir(path string) ([]os.DirEntry, error) {
	return os.ReadDir(path)
}
