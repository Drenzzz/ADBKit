package file

import (
	"ADBKit/internal/core"
	"context"
	"errors"
	"fmt"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
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

	localInfo, statErr := validateReadableHostPath("push_file", trimmedLocalPath)
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

	transferCtx, cancel := context.WithCancel(ctx)
	s.setCancel(cancel)
	defer func() {
		cancel()
		s.clearCancel()
	}()

	var result *core.ExecResult
	var cmdErr error
	for attempt := 1; attempt <= transferRetries; attempt++ {
		result, cmdErr = core.RunCommandStreaming(transferCtx, core.StreamingExecRequest{
			Command: s.getBinPath().Adb,
			Args:    []string{"-s", serial, "push", trimmedLocalPath, normalizedRemotePath},
			OnStderrLine: func(line string) {
				if m := adbProgressPattern.FindStringSubmatch(line); len(m) > 1 {
					name := fileName
					if len(m) > 2 {
						if base := filepath.Base(strings.TrimSpace(m[2])); base != "" && base != "." && base != "/" {
							name = base
						}
					}
					s.emitTransferProgress(name, "push", parseAdbPercent(m[1]))
				}
			},
		})
		if cmdErr == nil {
			s.emitTransferProgress(fileName, "push", 100)
			return fallbackMessage(result.Stdout, fmt.Sprintf("Pushed to %s", normalizedRemotePath)), nil
		}

		if transferCtx.Err() != nil {
			return "", core.NewOperationError("push_file", "Push cancelled by user", "transfer context cancelled", false)
		}

		if !isTransientADBError(cmdErr.Error()) || attempt == transferRetries {
			break
		}

		select {
		case <-transferCtx.Done():
			return "", core.NewOperationError("push_file", "Push cancelled by user", "transfer context cancelled", false)
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
		if ctx.Err() != nil {
			return "", core.NewOperationError("push_multiple_files", "Push batch cancelled", "transfer context cancelled", false)
		}
		trimmed := strings.TrimSpace(localPath)
		if trimmed == "" {
			continue
		}
		fileName := filepath.Base(trimmed)
		remotePath := path.Join(normalizedRemoteDir, fileName)
		if _, err := s.PushFile(ctx, trimmed, remotePath); err != nil {
			if isCancelledError(err) || ctx.Err() != nil {
				return "", core.NewOperationError("push_multiple_files", "Push batch cancelled", "transfer context cancelled", false)
			}
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

func isCancelledError(err error) bool {
	if err == nil || errors.Is(err, context.Canceled) {
		return err != nil
	}

	var operationErr *core.OperationError
	return errors.As(err, &operationErr) && strings.Contains(strings.ToLower(operationErr.Message), "cancel")
}

func (s *Service) emitTransferProgress(fileName, direction string, percent int) {
	if s.wailsCtx == nil {
		return
	}
	application.Get().Event.Emit(TransferProgressEvent, TransferProgress{
		FileName:  fileName,
		Direction: direction,
		Percent:   percent,
	})
}
