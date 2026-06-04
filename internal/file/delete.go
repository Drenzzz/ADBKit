package file

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"path"
	"strings"
	"time"
)

func (s *Service) DeleteFile(ctx context.Context, remotePath string) (string, error) {
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

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "rm", "-rf", quoteShellArg(normalizedPath)},
		Timeout: 30 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError("delete_file", "Failed to delete file", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("delete_file", "Failed to delete file", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Deleted %s", path.Base(normalizedPath))), nil
}

func (s *Service) DeleteMultipleFiles(ctx context.Context, remotePaths []string) (string, error) {
	if len(remotePaths) == 0 {
		return "", core.NewOperationError("delete_multiple_files", "No files were selected", "remote path list is empty", false)
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

func (s *Service) CreateDirectory(ctx context.Context, remotePath string) (string, error) {
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

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "mkdir", "-p", quoteShellArg(normalizedPath)},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError("create_directory", "Failed to create directory", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("create_directory", "Failed to create directory", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Created folder %s", path.Base(normalizedPath))), nil
}

func (s *Service) RenameFile(ctx context.Context, oldRemotePath string, newRemotePath string) (string, error) {
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

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "mv", quoteShellArg(normalizedOldPath), quoteShellArg(normalizedNewPath)},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError("rename_file", "Failed to rename file", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("rename_file", "Failed to rename file", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Renamed %s", path.Base(normalizedNewPath))), nil
}
