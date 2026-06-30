package flasher

import (
	"ADBKit/internal/core"
	"ADBKit/internal/device"
	"fmt"
	"strings"
)

func normalizeFastbootArgs(args string) ([]string, error) {
	trimmed := strings.TrimSpace(args)
	if trimmed == "" {
		return nil, core.NewOperationError("run_fastboot_command", "command arguments are required", "", false)
	}
	argList := strings.Fields(trimmed)
	for _, arg := range argList {
		if strings.ContainsAny(arg, "&|;><`$") {
			return nil, core.NewOperationError("run_fastboot_command", "command arguments contain blocked shell operators", fmt.Sprintf("blocked token found in arg: %s", arg), false)
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
		state := device.State("fastboot")
		mode := device.Mode("fastboot")
		switch rawState {
		case "fastboot", "bootloader":
			state = device.State("fastboot")
		case "recovery", "rescue":
			state = device.State("recovery")
			mode = device.Mode("adb")
		case "sideload":
			state = device.State("sideload")
			mode = device.Mode("adb")
		case "offline":
			state = device.State("offline")
			mode = device.Mode("adb")
		case "unauthorized":
			state = device.State("unauthorized")
			mode = device.Mode("adb")
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

func extractErrorDetail(result *core.ExecResult, err error) string {
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
