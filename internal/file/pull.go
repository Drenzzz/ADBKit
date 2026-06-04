package file

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"path"
	"path/filepath"
	"strings"
	"time"
)

func (s *Service) PullFile(ctx context.Context, remotePath string, localPath string) (string, error) {
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
		return "", core.NewOperationError("pull_file", "Destination path is required", "local destination path is empty", false)
	}

	fileName := path.Base(normalizedRemotePath)
	var result *core.ExecResult
	var cmdErr error
	for attempt := 1; attempt <= transferRetries; attempt++ {
		result, cmdErr = core.RunCommand(ctx, core.ExecRequest{
			Command: core.BinaryNameAdb,
			Args:    []string{"-s", serial, "pull", "-a", normalizedRemotePath, trimmedLocalPath},
			Timeout: 10 * time.Minute,
		})
		if cmdErr == nil {
			s.emitTransferProgress(fileName, "pull", 100)
			return fallbackMessage(result.Stdout, fmt.Sprintf("Saved file to %s", trimmedLocalPath)), nil
		}

		if !isTransientADBError(cmdErr.Error()) || attempt == transferRetries {
			break
		}

		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(transferDelay):
		}
	}

	return "", core.NewOperationError("pull_file", "Failed to pull file", cmdErr.Error(), true)
}

func (s *Service) PullMultipleFiles(ctx context.Context, remotePaths []string, localDirectory string) (string, error) {
	trimmedLocalDir := strings.TrimSpace(localDirectory)
	if trimmedLocalDir == "" {
		return "", core.NewOperationError("pull_multiple_files", "Destination directory is required", "local destination directory is empty", false)
	}
	if len(remotePaths) == 0 {
		return "", core.NewOperationError("pull_multiple_files", "No files were selected", "remote path list is empty", false)
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
