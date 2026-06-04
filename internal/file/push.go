package file

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"path"
	"path/filepath"
	"strings"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func (s *Service) PushFile(ctx context.Context, localPath string, remotePath string) (string, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	trimmedLocalPath := strings.TrimSpace(localPath)
	if trimmedLocalPath == "" {
		return "", core.NewOperationError("push_file", "Local file path is required", "local file path is empty", false)
	}

	localInfo, statErr := validateReadableHostFile("push_file", trimmedLocalPath)
	if statErr != nil {
		return "", statErr
	}

	normalizedRemotePath, err := normalizeRemotePath(remotePath)
	if err != nil {
		return "", err
	}
	if err := validateRemoteMutationPath("push_file", normalizedRemotePath); err != nil {
		return "", err
	}

	fileName := localInfo.Name()
	var result *core.ExecResult
	var cmdErr error
	for attempt := 1; attempt <= transferRetries; attempt++ {
		result, cmdErr = core.RunCommand(ctx, core.ExecRequest{
			Command: core.BinaryNameAdb,
			Args:    []string{"-s", serial, "push", trimmedLocalPath, normalizedRemotePath},
			Timeout: 10 * time.Minute,
		})
		if cmdErr == nil {
			s.emitTransferProgress(fileName, "push", 100)
			return fallbackMessage(result.Stdout, fmt.Sprintf("Pushed to %s", normalizedRemotePath)), nil
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

	return "", core.NewOperationError("push_file", "Failed to push file", cmdErr.Error(), true)
}

func (s *Service) PushMultipleFiles(ctx context.Context, localPaths []string, remoteDirectory string) (string, error) {
	if len(localPaths) == 0 {
		return "", core.NewOperationError("push_multiple_files", "No files were selected", "local path list is empty", false)
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

func (s *Service) emitTransferProgress(fileName, direction string, percent int) {
	if s.wailsCtx == nil {
		return
	}
	wailsruntime.EventsEmit(s.wailsCtx, TransferProgressEvent, TransferProgress{
		FileName:  fileName,
		Direction: direction,
		Percent:   percent,
	})
}
