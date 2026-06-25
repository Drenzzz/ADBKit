//go:build linux

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
		filepath.Join(home, "Android", "Sdk", "platform-tools", executable),
		filepath.Join("/usr", "bin", executable),
		filepath.Join("/usr", "local", "bin", executable),
	}
}
