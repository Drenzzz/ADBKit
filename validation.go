package main

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// ValidatePath checks if a path exists and is accessible.
func ValidatePath(path string) error {
	if strings.TrimSpace(path) == "" {
		return NewOperationError("validation", "path is empty", "", false)
	}
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return NewOperationError("validation", "path does not exist", path, false)
		}
		return NewOperationError("validation", "cannot access path", err.Error(), true)
	}
	_ = info
	return nil
}

func ValidateExecutable(path string) error {
	if err := ValidatePath(path); err != nil {
		return err
	}
	info, err := os.Stat(path)
	if err != nil {
		return NewOperationError("validation", "cannot stat file", err.Error(), true)
	}
	if info.IsDir() {
		return NewOperationError("validation", "path is a directory, not a file", path, false)
	}
	if runtime.GOOS != "windows" && info.Mode().Perm()&0o111 == 0 {
		return NewOperationError("validation", "file is not executable", path, false)
	}
	return nil
}

func ValidateBinaryExecutable(name, path string) error {
	if !IsSupportedBinaryName(name) {
		return NewOperationError("validation", "unsupported binary name", name, false)
	}
	if err := ValidateExecutable(path); err != nil {
		return err
	}
	actualName := strings.TrimSuffix(strings.ToLower(filepath.Base(path)), ".exe")
	if actualName != name {
		return NewOperationError("validation", "binary name does not match", path, false)
	}
	return nil
}

// EnsureDir creates a directory and all parents if it doesn't exist.
func EnsureDir(path string) error {
	return os.MkdirAll(path, 0o755)
}

// ParentDir returns the parent directory of a given path.
func ParentDir(path string) string {
	return filepath.Dir(path)
}
