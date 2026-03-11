package backend

import (
	"context"
	"fmt"
	"path"
	"regexp"
	"strings"
	"time"
)

var transferRetryAttempts = 3
var transferRetryDelay = 2 * time.Second

func quoteShellArg(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "'\"'\"'") + "'"
}

type batchTransferFailure struct {
	Path   string
	Reason string
}

func isTransientTransferError(err error) bool {
	if err == nil {
		return false
	}

	errText := strings.ToLower(err.Error())
	if strings.Contains(errText, "cancelled by user") || strings.Contains(errText, "command cancelled") {
		return false
	}

	markers := []string{
		"device offline",
		"device not found",
		"connection reset",
		"broken pipe",
		"protocol fault",
		"transport error",
		"resource temporarily unavailable",
		"no such device",
	}

	for _, marker := range markers {
		if strings.Contains(errText, marker) {
			return true
		}
	}

	return false
}

func (a *App) runTransferWithRetry(ctx context.Context, operation func() (string, error)) (string, error) {
	var output string
	var err error

	for attempt := 1; attempt <= transferRetryAttempts; attempt++ {
		if ctx.Err() != nil {
			return "", ctx.Err()
		}

		output, err = operation()
		if err == nil {
			return output, nil
		}

		if ctx.Err() != nil {
			return output, ctx.Err()
		}

		if !isTransientTransferError(err) || attempt == transferRetryAttempts {
			return output, err
		}

		select {
		case <-ctx.Done():
			return output, ctx.Err()
		case <-time.After(transferRetryDelay):
		}
	}

	return output, err
}

func formatTransferBatchSummary(destination string, successes []string, failures []batchTransferFailure) string {
	total := len(successes) + len(failures)
	var summary strings.Builder

	summary.WriteString(fmt.Sprintf("Transfer summary: %d/%d succeeded, %d failed.", len(successes), total, len(failures)))
	if destination != "" {
		summary.WriteString(fmt.Sprintf(" Destination: %s", destination))
	}

	if len(successes) > 0 {
		summary.WriteString("\n\nSucceeded items:")
		for _, item := range successes {
			summary.WriteString("\n- ")
			summary.WriteString(item)
		}
	}

	if len(failures) > 0 {
		summary.WriteString("\n\nFailed items:")
		for _, item := range failures {
			summary.WriteString("\n- ")
			summary.WriteString(item.Path)
			summary.WriteString(": ")
			summary.WriteString(item.Reason)
		}
	}

	return summary.String()
}

func (a *App) ListFiles(path string) ([]FileEntry, error) {

	// List files uses default timeout (60s) which is sufficient
	output, err := a.runAdbCommand("shell", "ls", "-lA", path)
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w. Output: %s", err, output)
	}

	var files []FileEntry
	lines := strings.Split(output, "\n")

	spaceRegex := regexp.MustCompile(`\s+`)

	for _, rawLine := range lines {
		line := strings.TrimSpace(rawLine)
		if line == "" || strings.HasPrefix(line, "total") {
			continue
		}

		parts := spaceRegex.Split(line, 9)
		if len(parts) < 8 {
			continue
		}

		permissions := parts[0]
		fileType := "File"
		size := ""
		if len(parts) > 4 {
			size = parts[4]
		}

		if len(permissions) > 0 {
			switch permissions[0] {
			case 'd':
				fileType = "Directory"
			case 'l':
				fileType = "Symlink"
			}
		}

		if fileType == "Symlink" {
			size = ""
		}

		var name string
		var date string
		var time string

		switch {
		case len(parts) >= 8:
			date = parts[5]
			time = parts[6]
			name = strings.Join(parts[7:], " ")
		case len(parts) == 7:
			date = parts[5]
			name = parts[6]
		case len(parts) == 6:
			name = parts[5]
		}

		if name == "" && len(parts) > 0 {
			name = parts[len(parts)-1]
			if len(parts) >= 3 {
				time = parts[len(parts)-2]
				date = parts[len(parts)-3]
			}
		}

		name = strings.TrimSpace(name)
		date = strings.TrimSpace(date)
		time = strings.TrimSpace(time)

		if fileType == "Symlink" {
			linkParts := strings.Split(name, " -> ")
			name = linkParts[0]
		}

		files = append(files, FileEntry{
			Name:        name,
			Type:        fileType,
			Size:        size,
			Permissions: permissions,
			Date:        date,
			Time:        time,
		})
	}

	return files, nil
}

func (a *App) PushFile(localPath string, remotePath string) (string, error) {

	serial, err := a.resolveActiveAdbSerial()
	if err != nil {
		return "", err
	}

	a.opMutex.Lock()
	// Large file/folder transfers can exceed 30 minutes.
	// Use explicit user cancellation instead of hard timeout.
	ctx, cancel := context.WithCancel(context.Background())
	a.currentCancel = cancel
	a.opMutex.Unlock()

	defer func() {
		cancel()
		a.opMutex.Lock()
		if a.currentCancel != nil {
			a.currentCancel = nil
		}
		a.opMutex.Unlock()
	}()

	output, err := a.runTransferWithRetry(ctx, func() (string, error) {
		return a.runCommandContext(ctx, "adb", "-s", serial, "push", localPath, remotePath)
	})
	if err != nil {
		if ctx.Err() == context.Canceled {
			return "", fmt.Errorf("push cancelled by user")
		}
		return "", fmt.Errorf("failed to push file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) PullFile(remotePath string, localPath string) (string, error) {

	serial, err := a.resolveActiveAdbSerial()
	if err != nil {
		return "", err
	}

	a.opMutex.Lock()
	// No timeout for file transfers, only user cancellation
	ctx, cancel := context.WithCancel(context.Background())
	a.currentCancel = cancel
	a.opMutex.Unlock()

	defer func() {
		cancel()
		a.opMutex.Lock()
		if a.currentCancel != nil {
			a.currentCancel = nil
		}
		a.opMutex.Unlock()
	}()

	output, err := a.runTransferWithRetry(ctx, func() (string, error) {
		return a.runCommandContext(ctx, "adb", "-s", serial, "pull", "-a", remotePath, localPath)
	})
	if err != nil {
		if ctx.Err() == context.Canceled {
			return "", fmt.Errorf("pull cancelled by user")
		}
		return "", fmt.Errorf("failed to pull file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) CreateFolder(fullPath string) (string, error) {
	if err := a.validateRemotePath(fullPath); err != nil {
		return "", err
	}

	command := fmt.Sprintf("mkdir -p %s", quoteShellArg(fullPath))

	output, err := a.runShellCommand(command)
	if err != nil {
		return "", fmt.Errorf("failed to create folder %s: %w. Output: %s", fullPath, err, output)
	}

	return fmt.Sprintf("Folder created: %s", fullPath), nil
}

func (a *App) DeleteFile(fullPath string) (string, error) {
	if err := a.validateRemotePath(fullPath); err != nil {
		return "", err
	}

	command := fmt.Sprintf("rm -rf %s", quoteShellArg(fullPath))

	output, err := a.runShellCommand(command)
	if err != nil {
		return "", fmt.Errorf("failed to delete %s: %w. Output: %s", fullPath, err, output)
	}

	return fmt.Sprintf("Deleted: %s", fullPath), nil
}

func (a *App) RenameFile(oldPath string, newPath string) (string, error) {
	if err := a.validateRemotePath(oldPath); err != nil {
		return "", err
	}

	if err := a.validateRemotePath(newPath); err != nil {
		return "", err
	}

	command := fmt.Sprintf("mv %s %s", quoteShellArg(oldPath), quoteShellArg(newPath))

	output, err := a.runShellCommand(command)
	if err != nil {
		return "", fmt.Errorf("failed to rename %s to %s: %w. Output: %s", oldPath, newPath, err, output)
	}

	return fmt.Sprintf("Renamed %s to %s", oldPath, newPath), nil
}

func (a *App) DeleteMultipleFiles(fullPaths []string) (string, error) {
	if len(fullPaths) == 0 {
		return "", fmt.Errorf("no files selected")
	}

	var successCount int
	var failCount int
	var errorMessages strings.Builder

	for _, path := range fullPaths {
		_, err := a.DeleteFile(path)
		if err != nil {
			failCount++
			errorMessages.WriteString(fmt.Sprintf("Failed %s: %v\n", path, err))
		} else {
			successCount++
		}
	}

	summary := fmt.Sprintf("Successfully deleted %d items.", successCount)
	if failCount > 0 {
		summary += fmt.Sprintf(" Failed to delete %d items.\nDetails:\n%s", failCount, errorMessages.String())
	}

	return summary, nil
}

func (a *App) PullMultipleFiles(remotePaths []string) (string, error) {
	if len(remotePaths) == 0 {
		return "", fmt.Errorf("no files selected to export")
	}

	localSaveFolder, err := a.SelectDirectoryForPull()
	if err != nil {
		return "", fmt.Errorf("failed to open folder dialog: %w", err)
	}

	if localSaveFolder == "" {
		return "Export cancelled by user.", nil
	}

	successes := make([]string, 0, len(remotePaths))
	failures := make([]batchTransferFailure, 0)

	// Batch pull: each file pull is discrete. We could potentially make the whole batch cancellable,
	// but currently only individual calls to PullFile are cancellable via the App.currentCancel mechanism.
	// Since PullFile implements the lock/cancel mechanism internally, cancelling *during* one file
	// will stop that file.
	// To cancel the whole batch, the user would hit "Cancel" which triggers App.CancelOperation().
	// That would kill the *current* PullFile command.
	// The loop here continues. Ideally we should check if cancellation happened.
	// But `a.currentCancel` is reset after each PullFile.
	// So repeatedly clicking cancel would be needed.
	// For now, this is acceptable for basic batch support.

	for _, remotePath := range remotePaths {
		_, err := a.PullFile(remotePath, localSaveFolder)
		itemName := path.Base(remotePath)
		if itemName == "." || itemName == "/" || strings.TrimSpace(itemName) == "" {
			itemName = remotePath
		}

		if err != nil {
			if strings.Contains(err.Error(), "cancelled by user") {
				failures = append(failures, batchTransferFailure{Path: itemName, Reason: "cancelled by user"})
				break
			}
			failures = append(failures, batchTransferFailure{Path: itemName, Reason: err.Error()})
		} else {
			successes = append(successes, itemName)
		}
	}

	summary := formatTransferBatchSummary(localSaveFolder, successes, failures)
	if len(failures) > 0 {
		return "", fmt.Errorf(summary)
	}

	return summary, nil
}
