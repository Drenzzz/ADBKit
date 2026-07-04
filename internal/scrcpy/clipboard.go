package scrcpy

import (
	"ADBKit/internal/core"
	"os/exec"
	"strings"
)

func (s *Service) PushClipboard(serial, text string) error {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return core.NewOperationError(
			"push_scrcpy_clipboard",
			"Device serial is required",
			"serial must not be empty",
			false,
		)
	}
	if text == "" {
		return core.NewOperationError(
			"push_scrcpy_clipboard",
			"Clipboard text is required",
			"text must not be empty",
			false,
		)
	}

	adbPath, err := s.resolveADBPath()
	if err != nil {
		return err
	}

	cmd := exec.CommandContext(s.ctx, adbPath, "-s", trimmedSerial, "shell", "cmd", "clipboard", "set", text)
	if out, runErr := cmd.CombinedOutput(); runErr != nil {
		return core.NewOperationError(
			"push_scrcpy_clipboard",
			"Failed to push clipboard to device",
			strings.TrimSpace(string(out)),
			true,
		)
	}

	s.logAudit("push_scrcpy_clipboard", trimmedSerial, true, "")
	return nil
}

func (s *Service) GetClipboard(serial string) (string, error) {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return "", core.NewOperationError(
			"get_scrcpy_clipboard",
			"Device serial is required",
			"serial must not be empty",
			false,
		)
	}

	adbPath, err := s.resolveADBPath()
	if err != nil {
		return "", err
	}

	cmd := exec.CommandContext(s.ctx, adbPath, "-s", trimmedSerial, "shell", "cmd", "clipboard", "get")
	out, runErr := cmd.CombinedOutput()
	if runErr != nil {
		return "", core.NewOperationError(
			"get_scrcpy_clipboard",
			"Failed to read clipboard from device",
			strings.TrimSpace(string(out)),
			true,
		)
	}
	s.logAudit("get_scrcpy_clipboard", trimmedSerial, true, "")
	return strings.TrimRight(string(out), "\r\n"), nil
}
