package file

import (
	"ADBKit/internal/core"
	"fmt"
	"path"
	"strconv"
	"strings"
)

func parseFileListOutput(output string, parentPath string, showHidden bool) ([]Entry, error) {
	lines := strings.Split(output, "\n")
	entries := make([]Entry, 0, len(lines))

	for _, rawLine := range lines {
		line := strings.TrimSpace(rawLine)
		if line == "" || strings.HasPrefix(line, "total ") {
			continue
		}

		entry, ok, err := parseFileListLine(line, parentPath)
		if err != nil {
			return nil, err
		}
		if !ok {
			continue
		}
		if !showHidden && entry.IsHidden {
			continue
		}

		entries = append(entries, entry)
	}

	return entries, nil
}

func parseFileListLine(line string, parentPath string) (Entry, bool, error) {
	parts := strings.Fields(line)
	if len(parts) < 8 {
		return Entry{}, false, fmt.Errorf("unexpected ls output: %s", line)
	}

	permissions := parts[0]
	name := strings.Join(parts[7:], " ")
	if permissions[0] == 'l' {
		name = strings.TrimSpace(strings.Split(name, " -> ")[0])
	}
	if name == "." || name == ".." || name == "" {
		return Entry{}, false, nil
	}

	sizeValue, err := strconv.ParseInt(parts[4], 10, 64)
	if err != nil {
		sizeValue = 0
	}

	entryType := parseFileType(permissions)
	entry := Entry{
		Name:        name,
		Path:        joinRemotePath(parentPath, name),
		Type:        entryType,
		Size:        sizeValue,
		SizeHuman:   formatFileSize(sizeValue),
		Permissions: permissions,
		ModifiedAt:  parts[5] + " " + parts[6],
		IsHidden:    strings.HasPrefix(name, "."),
	}

	if entryType == dirType {
		entry.Size = 0
		entry.SizeHuman = sizeDirNone
	}

	return entry, true, nil
}

func parseFileType(permissions string) string {
	if permissions == "" {
		return otherType
	}

	switch permissions[0] {
	case 'd':
		return dirType
	case 'l':
		return symlinkType
	case '-':
		return regularType
	default:
		return otherType
	}
}

func parseStorageInfoOutput(output string) (StorageInfo, error) {
	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if strings.HasPrefix(line, "Filesystem") || line == "" {
			continue
		}

		parts := strings.Fields(line)
		if len(parts) < 6 {
			continue
		}

		totalKB, err1 := strconv.ParseInt(parts[1], 10, 64)
		usedKB, err2 := strconv.ParseInt(parts[2], 10, 64)
		freeKB, err3 := strconv.ParseInt(parts[3], 10, 64)
		if err1 != nil || err2 != nil || err3 != nil {
			continue
		}

		pctStr := strings.TrimSuffix(parts[4], "%")
		pct, _ := strconv.Atoi(pctStr)

		return StorageInfo{
			MountPoint: parts[len(parts)-1],
			TotalBytes: totalKB * 1024,
			UsedBytes:  usedKB * 1024,
			FreeBytes:  freeKB * 1024,
			UsedPct:    pct,
		}, nil
	}

	return StorageInfo{}, fmt.Errorf("no valid df output found")
}

func normalizeRemotePath(remotePath string) (string, error) {
	trimmed := strings.TrimSpace(remotePath)
	if trimmed == "" {
		trimmed = defaultPath
	}

	if strings.Contains(trimmed, "\x00") {
		return "", core.NewOperationError("validate_remote_path", "Invalid remote path", "path contains null byte", false)
	}
	if strings.Contains(trimmed, "\n") || strings.Contains(trimmed, "\r") {
		return "", core.NewOperationError("validate_remote_path", "Invalid remote path", "path contains newline characters", false)
	}

	if !strings.HasPrefix(trimmed, "/") {
		trimmed = "/" + trimmed
	}

	cleaned := path.Clean(trimmed)
	if cleaned == "." {
		cleaned = defaultPath
	}

	return cleaned, nil
}

func validateRemoteMutationPath(operationName string, remotePath string) error {
	cleaned := path.Clean(strings.TrimSpace(remotePath))
	if cleaned == "." || cleaned == "/" {
		return core.NewOperationError(operationName, "Remote path is too broad", "refusing to modify device root path", false)
	}

	restrictedPaths := []string{
		"/acct", "/apex", "/bin", "/config", "/data", "/dev", "/etc",
		"/init", "/mnt", "/proc", "/product", "/root", "/sbin", "/sys",
		"/system", "/system_ext", "/vendor", "/vendor_dlkm", "/odm_dlkm", "/metadata",
	}

	for _, restricted := range restrictedPaths {
		if cleaned == restricted || strings.HasPrefix(cleaned, restricted+"/") {
			return core.NewOperationError(operationName, "Remote path is protected", fmt.Sprintf("refusing to modify protected device path: %s", restricted), false)
		}
	}

	return nil
}

func validateReadableHostFile(operationName string, filePath string) (osFileInfo, error) {
	info, err := osStat(filePath)
	if err != nil {
		return nil, core.NewOperationError(operationName, "File could not be accessed", err.Error(), false)
	}
	if info.IsDir() {
		return nil, core.NewOperationError(operationName, "File path points to a directory", "expected a regular file", false)
	}
	return info, nil
}

func joinRemotePath(parentPath string, name string) string {
	if strings.TrimSpace(parentPath) == "" {
		return path.Clean("/" + strings.TrimLeft(name, "/"))
	}
	return path.Clean(path.Join(parentPath, name))
}

func quoteShellArg(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "'\"'\"'") + "'"
}

func parseDirectorySizeOutput(output string) string {
	line := extractFirstLine(output)
	if line == "" {
		return sizeDirNone
	}

	parts := strings.Fields(line)
	if len(parts) == 0 {
		return sizeDirNone
	}

	return parts[0]
}

func formatFileSize(size int64) string {
	if size < 0 {
		return sizeUnknown
	}

	if size < 1024 {
		return fmt.Sprintf("%d B", size)
	}

	units := []string{"KB", "MB", "GB", "TB"}
	value := float64(size)
	unitIndex := -1
	for value >= 1024 && unitIndex < len(units)-1 {
		value /= 1024
		unitIndex++
	}

	if unitIndex < 0 {
		return fmt.Sprintf("%d B", size)
	}

	return fmt.Sprintf("%.1f %s", value, units[unitIndex])
}

func isTransientADBError(detail string) bool {
	normalized := strings.ToLower(strings.TrimSpace(detail))
	if normalized == "" {
		return false
	}

	transientFragments := []string{
		"device offline", "device not found", "no such device",
		"connection reset", "broken pipe", "protocol fault",
		"transport error", "resource temporarily unavailable",
	}

	for _, fragment := range transientFragments {
		if strings.Contains(normalized, fragment) {
			return true
		}
	}

	return false
}

func extractFirstLine(output string) string {
	for _, line := range strings.Split(output, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func fallbackMessage(output string, fallback string) string {
	line := extractFirstLine(output)
	if line != "" {
		return line
	}
	return fallback
}
