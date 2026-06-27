package file

import (
	"ADBKit/internal/core"
	"context"
	"strings"
	"time"
)

func (s *Service) ListFiles(ctx context.Context, remotePath string, showHidden bool) ([]Entry, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return nil, err
	}

	normalizedPath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return nil, err
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "ls", "-lAL", quoteShellArg(normalizedPath)},
		Timeout: 15 * time.Second,
	})
	if err != nil {
		return nil, core.NewOperationError("list_files", "Failed to list files", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return nil, core.NewOperationError("list_files", "Failed to list files", strings.TrimSpace(result.Stderr), true)
	}

	entries, err := parseFileListOutput(result.Stdout, normalizedPath, showHidden)
	if err != nil {
		return nil, core.NewOperationError("list_files", "Failed to parse file listing", err.Error(), false)
	}

	return entries, nil
}

func (s *Service) GetDirectorySize(ctx context.Context, remotePath string) (string, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	normalizedPath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return "", err
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "du", "-sh", quoteShellArg(normalizedPath)},
		Timeout: 30 * time.Second,
	})
	if err != nil {
		return sizeDirNone, core.NewOperationError("get_directory_size", "Failed to calculate folder size", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return sizeDirNone, core.NewOperationError("get_directory_size", "Failed to calculate folder size", strings.TrimSpace(result.Stderr), true)
	}

	return parseDirectorySizeOutput(result.Stdout), nil
}

func (s *Service) GetStorageInfo(ctx context.Context) (StorageInfo, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return StorageInfo{}, err
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "df", "-k", "/sdcard"},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return StorageInfo{}, core.NewOperationError("get_storage_info", "Failed to get storage info", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return StorageInfo{}, core.NewOperationError("get_storage_info", "Failed to get storage info", strings.TrimSpace(result.Stderr), true)
	}

	info, parseErr := parseStorageInfoOutput(result.Stdout)
	if parseErr != nil {
		return StorageInfo{}, core.NewOperationError("get_storage_info", "Failed to parse storage info", parseErr.Error(), false)
	}

	return info, nil
}
