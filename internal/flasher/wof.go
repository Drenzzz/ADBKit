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
	SettingTimeout  = 10 * time.Second
)

// StayAwakeAll is the stay_on_while_plugged_in bitmask covering AC(1)+USB(2)+
// wireless(4) chargers, i.e. the device never sleeps on any charger.
const StayAwakeAll = 7

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

// SetStayAwakeWhileCharging toggles the "Stay awake" developer option via
// stay_on_while_plugged_in. mask 7 = never sleep on any charger, 0 = off.
// Keeps a screen-off device from sleeping while USB is attached (WOF).
func (s *FastbootService) SetStayAwakeWhileCharging(ctx context.Context, serial string, enabled bool) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	adbPath, err := s.resolveBinaryPath(core.BinaryNameAdb)
	if err != nil {
		return "", err
	}
	value := "0"
	if enabled {
		value = "7"
	}
	setCtx, cancel := context.WithTimeout(ctx, SettingTimeout)
	defer cancel()
	result, err := core.RunCommand(setCtx, core.ExecRequest{
		Command: adbPath,
		Args:    []string{"-s", resolvedSerial, "shell", "settings", "put", "global", "stay_on_while_plugged_in", value},
	})
	if err != nil {
		return "", core.NewOperationError("set_stay_awake", "failed to update stay-awake setting", extractErrorDetail(result, err), true)
	}
	if strings.TrimSpace(result.Stderr) != "" {
		return "", core.NewOperationError("set_stay_awake", "failed to update stay-awake setting", strings.TrimSpace(result.Stderr), true)
	}
	if enabled {
		return "Stay awake while charging enabled on " + resolvedSerial, nil
	}
	return "Stay awake while charging disabled on " + resolvedSerial, nil
}

// GetStayAwakeWhileCharging reports whether stay_on_while_plugged_in is non-zero.
func (s *FastbootService) GetStayAwakeWhileCharging(ctx context.Context, serial string) (bool, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return false, err
	}
	adbPath, err := s.resolveBinaryPath(core.BinaryNameAdb)
	if err != nil {
		return false, err
	}
	getCtx, cancel := context.WithTimeout(ctx, SettingTimeout)
	defer cancel()
	result, err := core.RunCommand(getCtx, core.ExecRequest{
		Command: adbPath,
		Args:    []string{"-s", resolvedSerial, "shell", "settings", "get", "global", "stay_on_while_plugged_in"},
	})
	if err != nil {
		return false, core.NewOperationError("get_stay_awake", "failed to read stay-awake setting", extractErrorDetail(result, err), true)
	}
	value := strings.TrimSpace(result.Stdout)
	return value != "" && value != "0" && value != "null", nil
}

// WakeAndUnlock wakes the screen (KEYCODE_WAKEUP) then dismisses the keyguard
// (KEYCODE_MENU). Only bypasses swipe/none locks; a secure PIN still needs the
// code typed on-device. One-tap "turn my phone on" for a dead power button.
func (s *FastbootService) WakeAndUnlock(ctx context.Context, serial string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	adbPath, err := s.resolveBinaryPath(core.BinaryNameAdb)
	if err != nil {
		return "", err
	}
	unlockCtx, cancel := context.WithTimeout(ctx, WakeTimeout)
	defer cancel()
	// Combined shell call so both events land in one round-trip.
	result, err := core.RunCommand(unlockCtx, core.ExecRequest{
		Command: adbPath,
		Args:    []string{"-s", resolvedSerial, "shell", "input keyevent KEYCODE_WAKEUP; input keyevent 82"},
	})
	if err != nil {
		return "", core.NewOperationError("wake_and_unlock", "failed to wake and unlock device", extractErrorDetail(result, err), true)
	}
	if strings.TrimSpace(result.Stderr) != "" {
		return "", core.NewOperationError("wake_and_unlock", "failed to wake and unlock device", strings.TrimSpace(result.Stderr), true)
	}
	return "Wake + unlock sent to " + resolvedSerial, nil
}
