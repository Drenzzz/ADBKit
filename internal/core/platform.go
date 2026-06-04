package core

import "runtime"

// BinaryExecutableName returns the platform-specific executable name for a binary.
func BinaryExecutableName(name string) string {
	if runtime.GOOS == "windows" {
		return name + ".exe"
	}
	return name
}
