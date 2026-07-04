package flasher

import (
	"ADBKit/internal/core"
	"context"
	"strings"
	"time"
)

// WOF (Wake on Fastboot) timeouts.
const (
	ContinueTimeout = 30 * time.Second
	WakeTimeout     = 10 * time.Second
)

// FastbootContinue sends `fastboot continue` so a device stuck in the
// bootloader/fastboot menu boots into the OS without a physical Start/Power
// press. Primary WOF (Wake on Fastboot) action for broken power buttons.
func (s *FastbootService) FastbootContinue(ctx context.Context, serial string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	fastbootPath, err := s.resolveBinaryPath(core.BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	continueCtx, cancel := context.WithTimeout(ctx, ContinueTimeout)
	defer cancel()
	result, err := core.RunCommand(continueCtx, core.ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "continue"},
	})
	if err != nil {
		return "", core.NewOperationError("fastboot_continue", "failed to continue boot from fastboot", extractErrorDetail(result, err), true)
	}
	return successMessage(result.Stdout, "Continuing boot on "+resolvedSerial), nil
}

// WakeScreen sends KEYCODE_WAKEUP over ADB to turn the screen on without the
// power button. Complements FastbootContinue once the device is booted.
func (s *FastbootService) WakeScreen(ctx context.Context, serial string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	adbPath, err := s.resolveBinaryPath(core.BinaryNameAdb)
	if err != nil {
		return "", err
	}
	wakeCtx, cancel := context.WithTimeout(ctx, WakeTimeout)
	defer cancel()
	result, err := core.RunCommand(wakeCtx, core.ExecRequest{
		Command: adbPath,
		Args:    []string{"-s", resolvedSerial, "shell", "input", "keyevent", "KEYCODE_WAKEUP"},
	})
	if err != nil {
		return "", core.NewOperationError("wake_screen", "failed to wake device screen", extractErrorDetail(result, err), true)
	}
	if strings.TrimSpace(result.Stderr) != "" {
		return "", core.NewOperationError("wake_screen", "failed to wake device screen", strings.TrimSpace(result.Stderr), true)
	}
	return "Wake signal sent to " + resolvedSerial, nil
}
