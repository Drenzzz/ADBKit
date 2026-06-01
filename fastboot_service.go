package main

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"
)

const (
	fastbootFlashTimeout    = 20 * time.Minute
	fastbootSideloadTimeout = 45 * time.Minute
	fastbootWipeTimeout     = 10 * time.Minute
	fastbootGetvarTimeout   = 10 * time.Second
	fastbootCommandTimeout  = 5 * time.Minute
)

type FastbootDeviceInfo struct {
	Serial string      `json:"serial"`
	State  DeviceState `json:"state"`
	Mode   DeviceMode  `json:"mode"`
}

type FastbootService struct {
	binaryService       *BinaryService
	getConfig           func() *AppConfig
	resolveActiveSerial func(context.Context) (string, error)
}

func NewFastbootService(
	binaryService *BinaryService,
	getConfig func() *AppConfig,
	resolveActiveSerial func(context.Context) (string, error),
) *FastbootService {
	return &FastbootService{
		binaryService:       binaryService,
		getConfig:           getConfig,
		resolveActiveSerial: resolveActiveSerial,
	}
}

func (s *FastbootService) resolveBinaryPath(name string) (string, error) {
	if s.binaryService == nil {
		return "", NewOperationError("resolve_fastboot_binary", "binary service is not available", "", false)
	}
	if s.getConfig == nil {
		return "", NewOperationError("resolve_fastboot_binary", "config getter is not configured", "", false)
	}
	status := s.binaryService.GetBinaryStatus(s.getConfig())
	var info *BinaryInfo
	switch name {
	case BinaryNameAdb:
		info = status.Adb
	case BinaryNameFastboot:
		info = status.Fastboot
	case BinaryNameScrcpy:
		info = status.Scrcpy
	}
	if info == nil || info.Status != BinaryReady || info.Path == "" {
		return "", NewOperationError("resolve_fastboot_binary", "binary is not ready", fmt.Sprintf("binary '%s' unavailable", name), true)
	}
	return info.Path, nil
}

func (s *FastbootService) requireSerial(ctx context.Context, serial string) (string, error) {
	trimmed := strings.TrimSpace(serial)
	if trimmed != "" {
		return trimmed, nil
	}
	if s.resolveActiveSerial == nil {
		return "", NewOperationError("resolve_active_serial", "device selection is unavailable", "resolver not configured", false)
	}
	resolved, err := s.resolveActiveSerial(ctx)
	if err != nil {
		return "", NewOperationError("resolve_active_serial", "no active device available", err.Error(), true)
	}
	trimmed = strings.TrimSpace(resolved)
	if trimmed == "" {
		return "", NewOperationError("resolve_active_serial", "no active device available", "resolved serial is empty", true)
	}
	return trimmed, nil
}

func (s *FastbootService) ListDevices(ctx context.Context) ([]FastbootDeviceInfo, error) {
	fastbootPath, err := s.resolveBinaryPath(BinaryNameFastboot)
	if err != nil {
		return nil, err
	}
	result, err := RunCommand(ctx, ExecRequest{
		Command: fastbootPath,
		Args:    []string{"devices"},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return nil, NewOperationError("list_fastboot_devices", "failed to list fastboot devices", extractErrorDetail(result, err), true)
	}
	return parseFastbootDeviceInfos(result.Stdout), nil
}

func (s *FastbootService) FlashPartition(ctx context.Context, serial string, partition string, filePath string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	trimmedPartition := strings.ToLower(strings.TrimSpace(partition))
	if err := ValidateFlashPartition(trimmedPartition); err != nil {
		return "", err
	}
	trimmedFilePath := strings.TrimSpace(filePath)
	if err := ValidateFlashFile(trimmedFilePath); err != nil {
		return "", err
	}
	fastbootPath, err := s.resolveBinaryPath(BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	flashCtx, cancel := context.WithTimeout(ctx, fastbootFlashTimeout)
	defer cancel()
	result, err := RunCommand(flashCtx, ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "flash", trimmedPartition, trimmedFilePath},
	})
	if err != nil {
		return "", NewOperationError("flash_partition", "failed to flash partition", extractErrorDetail(result, err), true)
	}
	fallback := fmt.Sprintf("Flashed %s from %s", trimmedPartition, filepath.Base(trimmedFilePath))
	return successMessage(result.Stdout, fallback), nil
}

func (s *FastbootService) WipeData(ctx context.Context, serial string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	fastbootPath, err := s.resolveBinaryPath(BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	wipeCtx, cancel := context.WithTimeout(ctx, fastbootWipeTimeout)
	defer cancel()
	result, err := RunCommand(wipeCtx, ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "-w"},
	})
	if err != nil {
		return "", NewOperationError("wipe_data", "failed to wipe device data", extractErrorDetail(result, err), true)
	}
	return successMessage(result.Stdout, fmt.Sprintf("Wiped data on %s", resolvedSerial)), nil
}

func (s *FastbootService) GetActiveSlot(ctx context.Context, serial string) (string, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return "", err
	}
	fastbootPath, err := s.resolveBinaryPath(BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	getvarCtx, cancel := context.WithTimeout(ctx, fastbootGetvarTimeout)
	defer cancel()
	result, err := RunCommand(getvarCtx, ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "getvar", "current-slot"},
	})
	if err != nil {
		return "", NewOperationError("get_active_slot", "failed to read active slot", extractErrorDetail(result, err), true)
	}
	slot, parseErr := parseCurrentSlot(result.Stdout + "\n" + result.Stderr)
	if parseErr != nil {
		return "", NewOperationError("get_active_slot", "failed to parse active slot", parseErr.Error(), false)
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
		return "", NewOperationError("set_active_slot", "slot value is invalid", fmt.Sprintf("unsupported slot: %s", slot), false)
	}
	fastbootPath, err := s.resolveBinaryPath(BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	result, err := RunCommand(ctx, ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "set_active", normalizedSlot},
	})
	if err != nil {
		return "", NewOperationError("set_active_slot", "failed to change active slot", extractErrorDetail(result, err), true)
	}
	return successMessage(result.Stdout, fmt.Sprintf("Set active slot to %s", normalizedSlot)), nil
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
	fastbootPath, err := s.resolveBinaryPath(BinaryNameFastboot)
	if err != nil {
		return "", err
	}
	commandCtx, cancel := context.WithTimeout(ctx, fastbootCommandTimeout)
	defer cancel()
	result, err := RunCommand(commandCtx, ExecRequest{
		Command: fastbootPath,
		Args:    append([]string{"-s", resolvedSerial}, argList...),
	})
	if err != nil {
		return "", NewOperationError("run_fastboot_command", "failed to run fastboot command", extractErrorDetail(result, err), true)
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
	if err := ValidateSideloadFile(trimmedPath); err != nil {
		return "", err
	}
	// Sideload uses ADB binary, not fastboot
	adbPath, err := s.resolveBinaryPath(BinaryNameAdb)
	if err != nil {
		return "", err
	}
	sideloadCtx, cancel := context.WithTimeout(ctx, fastbootSideloadTimeout)
	defer cancel()
	result, err := RunCommand(sideloadCtx, ExecRequest{
		Command: adbPath,
		Args:    []string{"-s", resolvedSerial, "sideload", trimmedPath},
	})
	if err != nil {
		return "", NewOperationError("sideload_package", "failed to sideload package", extractErrorDetail(result, err), true)
	}
	fallback := fmt.Sprintf("Sideloaded %s", filepath.Base(trimmedPath))
	return successMessage(result.Stdout, fallback), nil
}

func (s *FastbootService) IsUserspace(ctx context.Context, serial string) (bool, error) {
	resolvedSerial, err := s.requireSerial(ctx, serial)
	if err != nil {
		return false, err
	}
	fastbootPath, err := s.resolveBinaryPath(BinaryNameFastboot)
	if err != nil {
		return false, err
	}
	result, err := RunCommand(ctx, ExecRequest{
		Command: fastbootPath,
		Args:    []string{"-s", resolvedSerial, "getvar", "is-userspace"},
	})
	if err != nil {
		return false, NewOperationError("check_userspace", "failed to check fastboot mode", extractErrorDetail(result, err), true)
	}
	output := strings.ToLower(result.Stdout + result.Stderr)
	return strings.Contains(output, "yes"), nil
}

func normalizeFastbootArgs(args string) ([]string, error) {
	trimmed := strings.TrimSpace(args)
	if trimmed == "" {
		return nil, NewOperationError("run_fastboot_command", "command arguments are required", "", false)
	}
	argList := strings.Fields(trimmed)
	for _, arg := range argList {
		if strings.ContainsAny(arg, "&|;><") {
			return nil, NewOperationError("run_fastboot_command", "command arguments contain blocked shell operators", fmt.Sprintf("blocked token found in arg: %s", arg), false)
		}
	}
	return argList, nil
}

func parseFastbootDeviceInfos(output string) []FastbootDeviceInfo {
	devices := make([]FastbootDeviceInfo, 0)
	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) < 2 {
			continue
		}
		rawState := strings.ToLower(strings.TrimSpace(parts[1]))
		state := DeviceStateFastboot
		mode := DeviceModeFastboot
		switch rawState {
		case string(DeviceStateFastboot), "bootloader":
			state = DeviceStateFastboot
		case string(DeviceStateRecovery), "rescue":
			state = DeviceStateRecovery
			mode = DeviceModeADB
		case string(DeviceStateSideload):
			state = DeviceStateSideload
			mode = DeviceModeADB
		case string(DeviceStateOffline):
			state = DeviceStateOffline
			mode = DeviceModeADB
		case string(DeviceStateUnauthorized):
			state = DeviceStateUnauthorized
			mode = DeviceModeADB
		}
		devices = append(devices, FastbootDeviceInfo{
			Serial: parts[0],
			State:  state,
			Mode:   mode,
		})
	}
	return devices
}

func parseCurrentSlot(output string) (string, error) {
	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if !strings.HasPrefix(line, "current-slot:") {
			continue
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			break
		}
		slot := strings.ToLower(strings.TrimSpace(parts[1]))
		if slot == "" {
			return "", fmt.Errorf("device does not report an active slot")
		}
		return slot, nil
	}
	return "", fmt.Errorf("current slot was not found in fastboot output")
}

func extractErrorDetail(result *ExecResult, err error) string {
	if result == nil {
		if err != nil {
			return err.Error()
		}
		return ""
	}
	detail := strings.TrimSpace(result.Stderr)
	if detail == "" {
		detail = strings.TrimSpace(result.Stdout)
	}
	return detail
}

func successMessage(stdout string, fallback string) string {
	msg := strings.TrimSpace(stdout)
	if msg == "" {
		return fallback
	}
	return msg
}
