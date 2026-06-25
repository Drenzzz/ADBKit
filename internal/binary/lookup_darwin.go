//go:build darwin

package binary

import (
	"ADBKit/internal/core"
	"os"
	"path/filepath"
)

func (bs *Service) commonPaths(name string) []string {
	home, _ := os.UserHomeDir()
	executable := core.BinaryExecutableName(name)

	return []string{
		filepath.Join(home, "Library", "Android", "sdk", "platform-tools", executable),
		filepath.Join("/usr", "local", "bin", executable),
		filepath.Join("/opt", "homebrew", "bin", executable),
	}
}
