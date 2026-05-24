package main

import (
	"context"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type FileEntry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	Type        string `json:"type"`
	Size        int64  `json:"size"`
	SizeHuman   string `json:"sizeHuman"`
	Permissions string `json:"permissions"`
	ModifiedAt  string `json:"modifiedAt"`
	IsHidden    bool   `json:"isHidden"`
}

type StorageInfo struct {
	MountPoint string `json:"mountPoint"`
	TotalBytes int64  `json:"totalBytes"`
	UsedBytes  int64  `json:"usedBytes"`
	FreeBytes  int64  `json:"freeBytes"`
	UsedPct    int    `json:"usedPct"`
}

type FileTransferProgress struct {
	FileName  string `json:"fileName"`
	Direction string `json:"direction"`
	Percent   int    `json:"percent"`
}

const (
	fileDefaultPath   = "/sdcard/"
	fileDirType       = "directory"
	fileRegularType   = "file"
	fileSymlinkType   = "symlink"
	fileOtherType     = "other"
	fileSizeUnknown   = "-"
	fileSizeDirNone   = "--"

	fileTransferRetries = 3
	fileTransferDelay   = 2 * time.Second

	FileTransferProgressEvent = "file_transfer_progress"
)

var adbProgressPattern = regexp.MustCompile(`\[\s*(\d+)%\]`)

type FileService struct {
	wailsCtx            context.Context
	resolveActiveSerial func(context.Context) (string, error)
}

func NewFileService(
	wailsCtx context.Context,
	resolveActiveSerial func(context.Context) (string, error),
) *FileService {
	return &FileService{
		wailsCtx:            wailsCtx,
		resolveActiveSerial: resolveActiveSerial,
	}
}

func (s *FileService) ListFiles(ctx context.Context, remotePath string, showHidden bool) ([]FileEntry, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return nil, err
	}

	normalizedPath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return nil, err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "ls", "-lAL", quoteShellArg(normalizedPath)},
		Timeout: 15 * time.Second,
	})
	if err != nil {
		return nil, NewOperationError("list_files", "Failed to list files", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return nil, NewOperationError("list_files", "Failed to list files", strings.TrimSpace(result.Stderr), true)
	}

	entries, err := parseFileListOutput(result.Stdout, normalizedPath, showHidden)
	if err != nil {
		return nil, NewOperationError("list_files", "Failed to parse file listing", err.Error(), false)
	}

	return entries, nil
}

func (s *FileService) GetDirectorySize(ctx context.Context, remotePath string) (string, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	normalizedPath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return "", err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "du", "-sh", quoteShellArg(normalizedPath)},
		Timeout: 30 * time.Second,
	})
	if err != nil {
		return fileSizeDirNone, NewOperationError("get_directory_size", "Failed to calculate folder size", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return fileSizeDirNone, NewOperationError("get_directory_size", "Failed to calculate folder size", strings.TrimSpace(result.Stderr), true)
	}

	return parseDirectorySizeOutput(result.Stdout), nil
}

func (s *FileService) GetStorageInfo(ctx context.Context) (StorageInfo, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return StorageInfo{}, err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "df", "-k", "/sdcard"},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return StorageInfo{}, NewOperationError("get_storage_info", "Failed to get storage info", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return StorageInfo{}, NewOperationError("get_storage_info", "Failed to get storage info", strings.TrimSpace(result.Stderr), true)
	}

	info, parseErr := parseStorageInfoOutput(result.Stdout)
	if parseErr != nil {
		return StorageInfo{}, NewOperationError("get_storage_info", "Failed to parse storage info", parseErr.Error(), false)
	}

	return info, nil
}

func (s *FileService) PullFile(ctx context.Context, remotePath string, localPath string) (string, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	normalizedRemotePath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return "", err
	}

	trimmedLocalPath := strings.TrimSpace(localPath)
	if trimmedLocalPath == "" {
		return "", NewOperationError("pull_file", "Destination path is required", "local destination path is empty", false)
	}

	fileName := path.Base(normalizedRemotePath)
	var result *ExecResult
	for attempt := 1; attempt <= fileTransferRetries; attempt++ {
		result, err = RunCommand(ctx, ExecRequest{
			Command: BinaryNameAdb,
			Args:    []string{"-s", serial, "pull", "-a", normalizedRemotePath, trimmedLocalPath},
			Timeout: 10 * time.Minute,
		})
		if err == nil {
			s.emitTransferProgress(fileName, "pull", 100)
			return fallbackMessage(result.Stdout, fmt.Sprintf("Saved file to %s", trimmedLocalPath)), nil
		}

		if !isTransientADBError(err.Error()) || attempt == fileTransferRetries {
			break
		}

		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(fileTransferDelay):
		}
	}

	return "", NewOperationError("pull_file", "Failed to pull file", err.Error(), true)
}

func (s *FileService) PullMultipleFiles(ctx context.Context, remotePaths []string, localDirectory string) (string, error) {
	trimmedLocalDir := strings.TrimSpace(localDirectory)
	if trimmedLocalDir == "" {
		return "", NewOperationError("pull_multiple_files", "Destination directory is required", "local destination directory is empty", false)
	}
	if len(remotePaths) == 0 {
		return "", NewOperationError("pull_multiple_files", "No files were selected", "remote path list is empty", false)
	}

	completed := 0
	for _, remotePath := range remotePaths {
		name := path.Base(strings.TrimSpace(remotePath))
		if _, err := s.PullFile(ctx, remotePath, filepath.Join(trimmedLocalDir, name)); err != nil {
			return "", err
		}
		completed++
	}

	return fmt.Sprintf("Pulled %d file(s) to %s", completed, trimmedLocalDir), nil
}

func (s *FileService) PushFile(ctx context.Context, localPath string, remotePath string) (string, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	trimmedLocalPath := strings.TrimSpace(localPath)
	if trimmedLocalPath == "" {
		return "", NewOperationError("push_file", "Local file path is required", "local file path is empty", false)
	}
	if err := validateReadableHostFile("push_file", trimmedLocalPath); err != nil {
		return "", err
	}

	normalizedRemotePath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return "", err
	}
	if err := validateRemoteMutationPath("push_file", normalizedRemotePath); err != nil {
		return "", err
	}

	fileName := filepath.Base(trimmedLocalPath)
	var result *ExecResult
	for attempt := 1; attempt <= fileTransferRetries; attempt++ {
		result, err = RunCommand(ctx, ExecRequest{
			Command: BinaryNameAdb,
			Args:    []string{"-s", serial, "push", trimmedLocalPath, normalizedRemotePath},
			Timeout: 10 * time.Minute,
		})
		if err == nil {
			s.emitTransferProgress(fileName, "push", 100)
			return fallbackMessage(result.Stdout, fmt.Sprintf("Copied file to %s", normalizedRemotePath)), nil
		}

		if !isTransientADBError(err.Error()) || attempt == fileTransferRetries {
			break
		}

		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(fileTransferDelay):
		}
	}

	return "", NewOperationError("push_file", "Failed to push file", err.Error(), true)
}

func (s *FileService) PushMultipleFiles(ctx context.Context, localPaths []string, remoteDirectory string) (string, error) {
	if len(localPaths) == 0 {
		return "", NewOperationError("push_multiple_files", "No files were selected", "local path list is empty", false)
	}

	normalizedRemoteDir, err := normalizeRemotePath(remoteDirectory)
	if err != nil {
		return "", err
	}
	if err := validateRemoteMutationPath("push_multiple_files", normalizedRemoteDir); err != nil {
		return "", err
	}

	successCount := 0
	failures := make([]string, 0)

	for _, localPath := range localPaths {
		trimmed := strings.TrimSpace(localPath)
		if trimmed == "" {
			continue
		}
		fileName := filepath.Base(trimmed)
		remotePath := path.Join(normalizedRemoteDir, fileName)
		if _, err := s.PushFile(ctx, trimmed, remotePath); err != nil {
			failures = append(failures, fmt.Sprintf("%s: %s", fileName, err.Error()))
			continue
		}
		successCount++
	}

	message := fmt.Sprintf("Pushed %d file(s) to %s", successCount, normalizedRemoteDir)
	if len(failures) > 0 {
		message = fmt.Sprintf("%s. Failed: %d. Details: %s", message, len(failures), strings.Join(failures, " | "))
	}

	return message, nil
}

func (s *FileService) DeleteFile(ctx context.Context, remotePath string) (string, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	normalizedPath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return "", err
	}
	if err := validateRemoteMutationPath("delete_file", normalizedPath); err != nil {
		return "", err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "rm", "-rf", quoteShellArg(normalizedPath)},
		Timeout: 30 * time.Second,
	})
	if err != nil {
		return "", NewOperationError("delete_file", "Failed to delete file", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError("delete_file", "Failed to delete file", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Deleted %s", path.Base(normalizedPath))), nil
}

func (s *FileService) DeleteMultipleFiles(ctx context.Context, remotePaths []string) (string, error) {
	if len(remotePaths) == 0 {
		return "", NewOperationError("delete_multiple_files", "No files were selected", "remote path list is empty", false)
	}

	successCount := 0
	failures := make([]string, 0)

	for _, remotePath := range remotePaths {
		if _, err := s.DeleteFile(ctx, remotePath); err != nil {
			failures = append(failures, fmt.Sprintf("%s: %s", path.Base(remotePath), err.Error()))
			continue
		}
		successCount++
	}

	message := fmt.Sprintf("Deleted %d file(s)", successCount)
	if len(failures) > 0 {
		message = fmt.Sprintf("%s. Failed: %d. Details: %s", message, len(failures), strings.Join(failures, " | "))
	}

	return message, nil
}

func (s *FileService) CreateDirectory(ctx context.Context, remotePath string) (string, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	normalizedPath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return "", err
	}
	if err := validateRemoteMutationPath("create_directory", normalizedPath); err != nil {
		return "", err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "mkdir", "-p", quoteShellArg(normalizedPath)},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", NewOperationError("create_directory", "Failed to create directory", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError("create_directory", "Failed to create directory", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Created folder %s", path.Base(normalizedPath))), nil
}

func (s *FileService) RenameFile(ctx context.Context, oldRemotePath string, newRemotePath string) (string, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	normalizedOldPath, err := normalizeRemotePath(oldRemotePath)
	if err != nil {
		return "", err
	}
	if err := validateRemoteMutationPath("rename_file", normalizedOldPath); err != nil {
		return "", err
	}

	normalizedNewPath, err := normalizeRemotePath(newRemotePath)
	if err != nil {
		return "", err
	}
	if err := validateRemoteMutationPath("rename_file", normalizedNewPath); err != nil {
		return "", err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "mv", quoteShellArg(normalizedOldPath), quoteShellArg(normalizedNewPath)},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", NewOperationError("rename_file", "Failed to rename file", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError("rename_file", "Failed to rename file", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Renamed %s", path.Base(normalizedNewPath))), nil
}

func (s *FileService) requireActiveSerial(ctx context.Context) (string, error) {
	if s.resolveActiveSerial == nil {
		return "", NewOperationError("resolve_active_serial", "No active device is available", "active serial resolver is not configured", true)
	}
	return s.resolveActiveSerial(ctx)
}

func (s *FileService) emitTransferProgress(fileName, direction string, percent int) {
	if s.wailsCtx == nil {
		return
	}
	wailsruntime.EventsEmit(s.wailsCtx, FileTransferProgressEvent, FileTransferProgress{
		FileName:  fileName,
		Direction: direction,
		Percent:   percent,
	})
}

func parseFileListOutput(output string, parentPath string, showHidden bool) ([]FileEntry, error) {
	lines := strings.Split(output, "\n")
	entries := make([]FileEntry, 0, len(lines))

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

func parseFileListLine(line string, parentPath string) (FileEntry, bool, error) {
	parts := strings.Fields(line)
	if len(parts) < 8 {
		return FileEntry{}, false, fmt.Errorf("unexpected ls output: %s", line)
	}

	permissions := parts[0]
	name := strings.Join(parts[7:], " ")
	if permissions[0] == 'l' {
		name = strings.TrimSpace(strings.Split(name, " -> ")[0])
	}
	if name == "." || name == ".." || name == "" {
		return FileEntry{}, false, nil
	}

	sizeValue, err := strconv.ParseInt(parts[4], 10, 64)
	if err != nil {
		sizeValue = 0
	}

	entryType := parseFileType(permissions)
	entry := FileEntry{
		Name:        name,
		Path:        joinRemotePath(parentPath, name),
		Type:        entryType,
		Size:        sizeValue,
		SizeHuman:   formatFileSize(sizeValue),
		Permissions: permissions,
		ModifiedAt:  parts[5] + " " + parts[6],
		IsHidden:    strings.HasPrefix(name, "."),
	}

	if entryType == fileDirType {
		entry.Size = 0
		entry.SizeHuman = fileSizeDirNone
	}

	return entry, true, nil
}

func parseFileType(permissions string) string {
	if permissions == "" {
		return fileOtherType
	}

	switch permissions[0] {
	case 'd':
		return fileDirType
	case 'l':
		return fileSymlinkType
	case '-':
		return fileRegularType
	default:
		return fileOtherType
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
		trimmed = fileDefaultPath
	}

	if strings.Contains(trimmed, "\x00") {
		return "", NewOperationError("validate_remote_path", "Invalid remote path", "path contains null byte", false)
	}
	if strings.Contains(trimmed, "\n") || strings.Contains(trimmed, "\r") {
		return "", NewOperationError("validate_remote_path", "Invalid remote path", "path contains newline characters", false)
	}

	if !strings.HasPrefix(trimmed, "/") {
		trimmed = "/" + trimmed
	}

	cleaned := path.Clean(trimmed)
	if cleaned == "." {
		cleaned = fileDefaultPath
	}

	return cleaned, nil
}

func validateRemoteMutationPath(operationName string, remotePath string) error {
	cleaned := path.Clean(strings.TrimSpace(remotePath))
	if cleaned == "." || cleaned == "/" {
		return NewOperationError(operationName, "Remote path is too broad", "refusing to modify device root path", false)
	}

	restrictedPaths := []string{
		"/acct", "/apex", "/bin", "/config", "/data", "/dev", "/etc",
		"/init", "/mnt", "/proc", "/product", "/root", "/sbin", "/sys",
		"/system", "/system_ext", "/vendor", "/vendor_dlkm", "/odm_dlkm", "/metadata",
	}

	for _, restricted := range restrictedPaths {
		if cleaned == restricted || strings.HasPrefix(cleaned, restricted+"/") {
			return NewOperationError(operationName, "Remote path is protected", fmt.Sprintf("refusing to modify protected device path: %s", restricted), false)
		}
	}

	return nil
}

func validateReadableHostFile(operationName string, filePath string) error {
	info, err := os.Stat(filePath)
	if err != nil {
		return NewOperationError(operationName, "File could not be accessed", err.Error(), false)
	}
	if info.IsDir() {
		return NewOperationError(operationName, "File path points to a directory", "expected a regular file", false)
	}
	return nil
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
		return fileSizeDirNone
	}

	parts := strings.Fields(line)
	if len(parts) == 0 {
		return fileSizeDirNone
	}

	return parts[0]
}

func formatFileSize(size int64) string {
	if size < 0 {
		return fileSizeUnknown
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
