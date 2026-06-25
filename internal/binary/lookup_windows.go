//go:build windows

package binary

import (
	"ADBKit/internal/core"
	"os"
	"path/filepath"
)

func (bs *Service) commonPaths(name string) []string {
	home, _ := os.UserHomeDir()
	appData := os.Getenv("APPDATA")
	executable := core.BinaryExecutableName(name)

	return []string{
		filepath.Join(home, "AppData", "Local", "Android", "Sdk", "platform-tools", executable),
		filepath.Join(appData, "adbkit", "bin", executable),
	}
}
