//go:build windows

package binary

import (
	"ADBKit/internal/core"
	"os"
	"path/filepath"
)

func (bs *Service) commonPaths(name string) []string {
	home, _ := os.UserHomeDir()
	localAppData := os.Getenv("LOCALAPPDATA")
	androidHome := os.Getenv("ANDROID_HOME")
	androidSDKRoot := os.Getenv("ANDROID_SDK_ROOT")
	executable := core.BinaryExecutableName(name)

	paths := []string{
		filepath.Join(androidSDKRoot, "platform-tools", executable),
		filepath.Join(androidHome, "platform-tools", executable),
		filepath.Join(localAppData, "Android", "Sdk", "platform-tools", executable),
		filepath.Join(home, "AppData", "Local", "Android", "Sdk", "platform-tools", executable),
		filepath.Join("C:", "Android", "Sdk", "platform-tools", executable),
	}

	result := make([]string, 0, len(paths))
	seen := make(map[string]struct{})
	for _, candidate := range paths {
		if candidate == "" {
			continue
		}
		if _, ok := seen[candidate]; ok {
			continue
		}
		seen[candidate] = struct{}{}
		result = append(result, candidate)
	}
	return result
}
