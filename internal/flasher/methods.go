package flasher

import (
	"ADBKit/internal/core"
	"context"
	"path/filepath"
	"strings"
	"time"
)

func (s *FastbootService) ListDevices(ctx context.Context) ([]FastbootDeviceInfo, error) {
	fastbootPath, err := s.resolveBinaryPath(core.BinaryNameFastboot)
	if err != nil {
		return nil, err
	}
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: fastbootPath,
		Args:    []string{"devices"},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return nil, core.NewOperationError("list_fastboot_devices", "failed to list fastboot devices", extractErrorDetail(result, err), true)
	}
	return parseFastbootDeviceInfos(result.Stdout), nil
}

func (s *FastbootService) FlashPartition(ctx context.Context, serial string, partition string, filePath string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	trimmedPartition := strings.ToLower(strings.TrimSpace(partition))
	if err := core.ValidateFlashPartition(trimmedPartition); err != nil {
		return "", err
	}
	trimmedFilePath := strings.TrimSpace(filePath)
	if err := core.ValidateFlashFile(trimmedFilePath); err != nil {
		return "", err
	}
	fastbootPath, err := s.resolveBinaryPath(core.BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	flashCtx, cancel := context.WithTimeout(ctx, FlashTimeout)
	defer cancel()
	result, err := core.RunCommand(flashCtx, core.ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "flash", trimmedPartition, trimmedFilePath},
	})
	if err != nil {
		return "", core.NewOperationError("flash_partition", "failed to flash partition", extractErrorDetail(result, err), true)
	}
	fallback := "Flashed " + trimmedPartition + " from " + filepath.Base(trimmedFilePath)
	return successMessage(result.Stdout, fallback), nil
}

func (s *FastbootService) WipeData(ctx context.Context, serial string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	fastbootPath, err := s.resolveBinaryPath(core.BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	wipeCtx, cancel := context.WithTimeout(ctx, WipeTimeout)
	defer cancel()
	result, err := core.RunCommand(wipeCtx, core.ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "-w"},
	})
	if err != nil {
		return "", core.NewOperationError("wipe_data", "failed to wipe device data", extractErrorDetail(result, err), true)
	}
	return successMessage(result.Stdout, "Wiped data on "+resolvedSerial), nil
}

func (s *FastbootService) GetActiveSlot(ctx context.Context, serial string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	fastbootPath, err := s.resolveBinaryPath(core.BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	getvarCtx, cancel := context.WithTimeout(ctx, GetvarTimeout)
	defer cancel()
	result, err := core.RunCommand(getvarCtx, core.ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "getvar", "current-slot"},
	})
	if err != nil {
		return "", core.NewOperationError("get_active_slot", "failed to read active slot", extractErrorDetail(result, err), true)
	}
	slot, parseErr := parseCurrentSlot(result.Stdout + "\n" + result.Stderr)
	if parseErr != nil {
		return "", core.NewOperationError("get_active_slot", "failed to parse active slot", parseErr.Error(), false)
	}
	return slot, nil
}

func (s *FastbootService) SetActiveSlot(ctx context.Context, serial string, slot string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	normalizedSlot := strings.ToLower(strings.TrimSpace(slot))
	if normalizedSlot != "a" && normalizedSlot != "b" {
		return "", core.NewOperationError("set_active_slot", "slot value is invalid", "unsupported slot: "+slot, false)
	}
	fastbootPath, err := s.resolveBinaryPath(core.BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "set_active", normalizedSlot},
	})
	if err != nil {
		return "", core.NewOperationError("set_active_slot", "failed to change active slot", extractErrorDetail(result, err), true)
	}
	return successMessage(result.Stdout, "Set active slot to "+normalizedSlot), nil
}

func (s *FastbootService) RunCustomCommand(ctx context.Context, serial string, args string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	argList, err := normalizeFastbootArgs(args)
	if err != nil {
		return "", err
	}
	fastbootPath, err := s.resolveBinaryPath(core.BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	commandCtx, cancel := context.WithTimeout(ctx, CommandTimeout)
	defer cancel()
	result, err := core.RunCommand(commandCtx, core.ExecRequest{
		Command: fastbootPath,
		Args:    append([]string{"-s", resolvedSerial}, argList...),
	})
	if err != nil {
		return "", core.NewOperationError("run_fastboot_command", "failed to run fastboot command", extractErrorDetail(result, err), true)
	}
	output := strings.TrimSpace(strings.Join([]string{result.Stdout, result.Stderr}, "\n"))
	if output == "" {
		output = "Fastboot command completed"
	}
	return output, nil
}

func (s *FastbootService) SideloadPackage(ctx context.Context, serial string, zipPath string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	trimmedPath := strings.TrimSpace(zipPath)
	if err := core.ValidateSideloadFile(trimmedPath); err != nil {
		return "", err
	}
	adbPath, err := s.resolveBinaryPath(core.BinaryNameAdb)
	if err != nil {
		return "", err
	}
	sideloadCtx, cancel := context.WithTimeout(ctx, SideloadTimeout)
	defer cancel()
	result, err := core.RunCommand(sideloadCtx, core.ExecRequest{
		Command: adbPath,
		Args:    []string{"-s", resolvedSerial, "sideload", trimmedPath},
	})
	if err != nil {
		return "", core.NewOperationError("sideload_package", "failed to sideload package", extractErrorDetail(result, err), true)
	}
	fallback := "Sideloaded " + filepath.Base(trimmedPath)
	return successMessage(result.Stdout, fallback), nil
}

func (s *FastbootService) IsUserspace(ctx context.Context, serial string) (bool, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return false, err
	}
	fastbootPath, err := s.resolveBinaryPath(core.BinaryNameFastboot)
	if err != nil {
		return false, err
	}
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "getvar", "is-userspace"},
	})
	if err != nil {
		return false, core.NewOperationError("check_userspace", "failed to check fastboot mode", extractErrorDetail(result, err), true)
	}
	output := strings.ToLower(result.Stdout + result.Stderr)
	return strings.Contains(output, "yes"), nil
}
