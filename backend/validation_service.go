package backend

import (
	"fmt"
	"path/filepath"
	"strings"
)

var allowedFlashPartitions = map[string]bool{
	"boot":          true,
	"boot_a":        true,
	"boot_b":        true,
	"init_boot":     true,
	"init_boot_a":   true,
	"init_boot_b":   true,
	"vendor_boot":   true,
	"vendor_boot_a": true,
	"vendor_boot_b": true,
	"recovery":      true,
	"recovery_a":    true,
	"recovery_b":    true,
	"system":        true,
	"system_ext":    true,
	"vendor":        true,
	"product":       true,
	"odm":           true,
	"vbmeta":        true,
	"vbmeta_system": true,
	"vbmeta_vendor": true,
	"dtbo":          true,
	"super":         true,
	"userdata":      true,
}

var allowedFlashExtensions = map[string]bool{
	".img": true,
	".bin": true,
}

var allowedSideloadExtensions = map[string]bool{
	".zip": true,
}

func (a *App) validateFlashPartition(partition string) error {
	part := strings.ToLower(strings.TrimSpace(partition))
	if !allowedFlashPartitions[part] {
		return fmt.Errorf("security error: partition '%s' is not in the allowed flash list", partition)
	}
	return nil
}

func (a *App) validateFlashFile(filePath string) error {
	ext := strings.ToLower(filepath.Ext(filePath))
	if !allowedFlashExtensions[ext] {
		return fmt.Errorf("security error: invalid image file extension '%s'. only .img or .bin allowed", ext)
	}
	return nil
}

func (a *App) validateSideloadFile(filePath string) error {
	ext := strings.ToLower(filepath.Ext(filePath))
	if !allowedSideloadExtensions[ext] {
		return fmt.Errorf("security error: invalid sideload file extension '%s'. only .zip allowed", ext)
	}
	return nil
}

func (a *App) validateShellCommand(command string) error {
	// Block shell operators that can be used for command injection or chaining
	blockedChars := []string{"&", "|", ";", ">", "<", "$(", "`"}
	for _, char := range blockedChars {
		if strings.Contains(command, char) {
			return fmt.Errorf("security error: shell command contains illegal character or operator '%s'", char)
		}
	}
	return nil
}

func (a *App) validateHostCommand(args []string) error {
	blockedChars := []string{"&", "|", ";", ">", "<"}
	for _, arg := range args {
		for _, char := range blockedChars {
			if strings.Contains(arg, char) {
				return fmt.Errorf("security error: host command argument contains illegal character or operator '%s'", char)
			}
		}
	}
	return nil
}

func (a *App) validateRemotePath(path string) error {
	trimmedPath := strings.TrimSpace(path)
	if trimmedPath == "" {
		return fmt.Errorf("security error: remote path cannot be empty")
	}

	if strings.Contains(trimmedPath, "\x00") {
		return fmt.Errorf("security error: remote path contains null byte")
	}

	if strings.ContainsAny(trimmedPath, "\n\r") {
		return fmt.Errorf("security error: remote path contains newline characters")
	}

	return nil
}
