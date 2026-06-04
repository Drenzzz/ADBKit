package device

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"strings"
)

func (s *Service) RebootDevice(ctx context.Context, serial string, mode string) (string, error) {
	if serial == "" {
		return "", core.NewOperationError("reboot_device", "device serial is required", "serial must not be empty", false)
	}

	mode = strings.TrimSpace(mode)

	connectionMode, err := s.DetectDeviceMode(ctx, serial)
	if err != nil {
		return "", err
	}

	switch connectionMode {
	case ModeADB:
		args := []string{"-s", serial, "reboot"}
		if mode != "" {
			args = append(args, mode)
		}
		result, err := core.RunCommand(ctx, core.ExecRequest{
			Command: core.BinaryNameAdb,
			Args:    args,
			Timeout: 10e9,
		})
		if err != nil {
			return "", core.NewOperationError("reboot_device", "failed to reboot device", err.Error(), true)
		}
		if result.ExitCode != 0 {
			return "", core.NewOperationError("reboot_device", "reboot command failed", strings.TrimSpace(result.Stderr), true)
		}
		return fmt.Sprintf("Reboot command sent to %s (%s)", serial, mode), nil

	case ModeFastboot:
		args := []string{"reboot"}
		if mode != "" {
			args = append(args, mode)
		}
		result, err := core.RunCommand(ctx, core.ExecRequest{
			Command: core.BinaryNameFastboot,
			Args:    args,
			Timeout: 10e9,
		})
		if err != nil {
			return "", core.NewOperationError("reboot_device", "failed to reboot device", err.Error(), true)
		}
		if result.ExitCode != 0 {
			return "", core.NewOperationError("reboot_device", "reboot command failed", strings.TrimSpace(result.Stderr), true)
		}
		return fmt.Sprintf("Reboot command sent to %s (%s)", serial, mode), nil

	default:
		return "", core.NewOperationError("reboot_device", "no connected device detected in adb or fastboot mode", fmt.Sprintf("serial '%s' mode is %s", serial, connectionMode), true)
	}
}
