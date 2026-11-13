package device

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"os"
	"strings"
	"time"
)

const screenshotTimeout = 30 * time.Second

// TakeScreenshot captures the current display over adb exec-out and writes the
// PNG straight to outputPath. It needs no scrcpy mirror session, so the Devices
// route can offer it without touching the Scrcpy Hub lifecycle.
func (s *Service) TakeScreenshot(ctx context.Context, serial string, outputPath string) (string, error) {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return "", core.NewOperationError("take_screenshot", "device serial is required", "serial must not be empty", false)
	}

	trimmedOutput := strings.TrimSpace(outputPath)
	if trimmedOutput == "" {
		return "", core.NewOperationError("take_screenshot", "output path is required", "output path is empty", false)
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", trimmedSerial, "exec-out", "screencap", "-p"},
		Timeout: screenshotTimeout,
	})
	if err != nil && result == nil {
		return "", core.NewOperationError("take_screenshot", "failed to capture screenshot", err.Error(), true)
	}
	if result.ExitCode != 0 {
		detail := strings.TrimSpace(result.Stderr)
		if detail == "" {
			detail = strings.TrimSpace(result.Stdout)
		}
		if detail == "" {
			detail = "adb exited without output"
		}
		return "", core.NewOperationError("take_screenshot", "screenshot command failed", detail, true)
	}

	data := []byte(result.Stdout)
	if len(data) == 0 {
		return "", core.NewOperationError("take_screenshot", "screenshot is empty", "adb returned no data", true)
	}
	if err := os.WriteFile(trimmedOutput, data, 0o644); err != nil {
		return "", core.NewOperationError("take_screenshot", "failed to save screenshot", err.Error(), false)
	}

	return fmt.Sprintf("Screenshot saved to %s", trimmedOutput), nil
}
