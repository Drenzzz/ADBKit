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
			Args:    []string{"-s", serial, "pull", "-a", normalizedRemotePath, trimmedLocalPath},
			OnStderrLine: func(line string) {
				if m := adbProgressPattern.FindStringSubmatch(line); len(m) > 1 {
					name := fileName
					if len(m) > 2 {
						if base := path.Base(strings.TrimSpace(m[2])); base != "" && base != "." && base != "/" {
							name = base
						}
					}
					s.emitTransferProgress(name, "pull", parseAdbPercent(m[1]))
				}
			},
		})
		if cmdErr == nil {
			s.emitTransferProgress(fileName, "pull", 100)
			return fallbackMessage(result.Stdout, fmt.Sprintf("Saved file to %s", trimmedLocalPath)), nil
		}

		if transferCtx.Err() != nil {
			return "", core.NewOperationError("pull_file", "Pull cancelled by user", "transfer context cancelled", false)
		}

		if !isTransientADBError(cmdErr.Error()) || attempt == transferRetries {
			break
		}

		select {
		case <-transferCtx.Done():
			return "", core.NewOperationError("pull_file", "Pull cancelled by user", "transfer context cancelled", false)
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
		if ctx.Err() != nil {
			return "", core.NewOperationError("pull_multiple_files", "Pull batch cancelled", "transfer context cancelled", false)
		}
		name := path.Base(strings.TrimSpace(remotePath))
		if _, err := s.PullFile(ctx, remotePath, filepath.Join(trimmedLocalDir, name)); err != nil {
			return "", err
		}
		completed++
	}

	return fmt.Sprintf("Pulled %d file(s) to %s", completed, trimmedLocalDir), nil
}

func parseAdbPercent(s string) int {
	pct := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			pct = pct*10 + int(c-'0')
		}
	}
	return pct
}
