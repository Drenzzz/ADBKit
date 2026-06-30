package core

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

const (
	BinaryNameAdb      = "adb"
	BinaryNameFastboot = "fastboot"
	BinaryNameScrcpy   = "scrcpy"
)

func IsSupportedBinaryName(name string) bool {
	switch name {
	case BinaryNameAdb, BinaryNameFastboot, BinaryNameScrcpy:
		return true
	default:
		return false
	}
}

// ValidatePath checks if a path exists and is accessible.
// Rejects path traversal sequences (../) to prevent directory escape.
func ValidatePath(path string) error {
	trimmed := strings.TrimSpace(path)
	if trimmed == "" {
		return NewOperationError("validation", "path is empty", "", false)
	}
	if strings.Contains(trimmed, ".."+string(filepath.Separator)) || trimmed == ".." {
		return NewOperationError("validation", "path traversal is not allowed", trimmed, false)
	}
	info, err := os.Stat(trimmed)
	if err != nil {
		if os.IsNotExist(err) {
			return NewOperationError("validation", "path does not exist", trimmed, false)
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

var allowedAPKExtensions = map[string]struct{}{
	".apk": {},
}

func ValidateAPKFile(filePath string) error {
	trimmedPath := strings.TrimSpace(filePath)
	if trimmedPath == "" {
		return NewOperationError("validate_apk_file", "APK file path is required", "file path must not be empty", false)
	}

	extension := strings.ToLower(filepath.Ext(trimmedPath))
	if _, ok := allowedAPKExtensions[extension]; !ok {
		return NewOperationError("validate_apk_file", "APK file type is invalid", "only .apk files are allowed", false)
	}

	info, err := os.Stat(trimmedPath)
	if err != nil {
		return NewOperationError("validate_apk_file", "File could not be accessed", err.Error(), false)
	}
	if info.IsDir() {
		return NewOperationError("validate_apk_file", "File path points to a directory", "expected a regular file", false)
	}

	return nil
}

var allowedFlashPartitions = map[string]struct{}{
	"boot":          {},
	"boot_a":        {},
	"boot_b":        {},
	"init_boot":     {},
	"init_boot_a":   {},
	"init_boot_b":   {},
	"vendor_boot":   {},
	"vendor_boot_a": {},
	"vendor_boot_b": {},
	"dtbo":          {},
	"vbmeta":        {},
	"vbmeta_system": {},
	"vbmeta_vendor": {},
	"recovery":      {},
	"recovery_a":    {},
	"recovery_b":    {},
	"system":        {},
	"system_ext":    {},
	"vendor":        {},
	"product":       {},
	"odm":           {},
	"super":         {},
	"userdata":      {},
}

var allowedFlashExtensions = map[string]struct{}{
	".img": {},
	".bin": {},
}

var allowedSideloadExtensions = map[string]struct{}{
	".zip": {},
}

func ValidateFlashPartition(partition string) error {
	trimmed := strings.ToLower(strings.TrimSpace(partition))
	if trimmed == "" {
		return NewOperationError("validate_flash_partition", "partition name is required", "", false)
	}
	if _, ok := allowedFlashPartitions[trimmed]; !ok {
		return NewOperationError("validate_flash_partition", "partition is not allowed", trimmed, false)
	}
	return nil
}

func ValidateFlashFile(filePath string) error {
	trimmed := strings.TrimSpace(filePath)
	if trimmed == "" {
		return NewOperationError("validate_flash_file", "image file path is required", "", false)
	}
	extension := strings.ToLower(filepath.Ext(trimmed))
	if _, ok := allowedFlashExtensions[extension]; !ok {
		return NewOperationError("validate_flash_file", "file type is not allowed for flashing", "only .img and .bin files are allowed", false)
	}
	info, err := os.Stat(trimmed)
	if err != nil {
		return NewOperationError("validate_flash_file", "file could not be accessed", err.Error(), false)
	}
	if info.IsDir() {
		return NewOperationError("validate_flash_file", "path points to a directory", "expected a regular file", false)
	}
	return nil
}

func ValidateSideloadFile(filePath string) error {
	trimmed := strings.TrimSpace(filePath)
	if trimmed == "" {
		return NewOperationError("validate_sideload_file", "zip file path is required", "", false)
	}
	extension := strings.ToLower(filepath.Ext(trimmed))
	if _, ok := allowedSideloadExtensions[extension]; !ok {
		return NewOperationError("validate_sideload_file", "file type is not allowed for sideloading", "only .zip files are allowed", false)
	}
	info, err := os.Stat(trimmed)
	if err != nil {
		return NewOperationError("validate_sideload_file", "file could not be accessed", err.Error(), false)
	}
	if info.IsDir() {
		return NewOperationError("validate_sideload_file", "path points to a directory", "expected a regular file", false)
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
