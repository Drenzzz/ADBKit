package device

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"strconv"
	"strings"
)

func (s *Service) listADBDevices(ctx context.Context) ([]Summary, error) {
	paths := s.getBinPath()
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: paths.Adb,
		Args:    []string{"devices", "-l"},
		Timeout: 5e9,
	})
	if err != nil {
		return nil, core.NewOperationError("list_adb_devices", "failed to list ADB devices", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return nil, core.NewOperationError("list_adb_devices", "adb devices failed", strings.TrimSpace(result.Stderr), true)
	}

	return parseADBDevices(result.Stdout), nil
}

func (s *Service) listFastbootDevices(ctx context.Context) ([]Summary, error) {
	paths := s.getBinPath()
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: paths.Fastboot,
		Args:    []string{"devices"},
		Timeout: 5e9,
	})
	if err != nil {
		return nil, core.NewOperationError("list_fastboot_devices", "failed to list fastboot devices", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return nil, core.NewOperationError("list_fastboot_devices", "fastboot devices failed", strings.TrimSpace(result.Stderr), true)
	}

	return parseFastbootDevices(result.Stdout), nil
}

func (s *Service) getDeviceProperties(ctx context.Context, serial string) (map[string]string, error) {
	paths := s.getBinPath()
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: paths.Adb,
		Args:    []string{"-s", serial, "shell", "getprop"},
		Timeout: 10e9,
	})
	if err != nil {
		return nil, err
	}
	return parseGetpropOutput(result.Stdout), nil
}

func (s *Service) getBatteryLevel(ctx context.Context, serial string) (string, error) {
	paths := s.getBinPath()
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: paths.Adb,
		Args:    []string{"-s", serial, "shell", "dumpsys", "battery"},
		Timeout: 5e9,
	})
	if err != nil {
		return "", err
	}
	return parseBatteryLevel(result.Stdout), nil
}

func (s *Service) getStorageInfo(ctx context.Context, serial string) (string, error) {
	paths := s.getBinPath()
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: paths.Adb,
		Args:    []string{"-s", serial, "shell", "df", "/data"},
		Timeout: 5e9,
	})
	if err != nil {
		return "", err
	}
	return parseStorageInfo(result.Stdout), nil
}

func (s *Service) getRAMTotal(ctx context.Context, serial string) (string, error) {
	paths := s.getBinPath()
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: paths.Adb,
		Args:    []string{"-s", serial, "shell", "cat", "/proc/meminfo"},
		Timeout: 5e9,
	})
	if err != nil {
		return "", err
	}
	return parseRAMTotal(result.Stdout), nil
}

func parseADBDevices(output string) []Summary {
	lines := strings.Split(output, "\n")
	devices := make([]Summary, 0)

	for _, rawLine := range lines {
		line := strings.TrimSpace(rawLine)
		if line == "" || strings.HasPrefix(line, "List of devices attached") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}

		device := Summary{
			Serial: fields[0],
			State:  State(fields[1]),
			Mode:   ModeADB,
		}

		if device.State != StateReady && device.State != StateOffline &&
			device.State != StateUnauthorized && device.State != StateRecovery &&
			device.State != StateSideload {
			device.State = StateUnknown
		}

		for _, field := range fields[2:] {
			key, value, ok := strings.Cut(field, ":")
			if !ok {
				continue
			}
			switch key {
			case "product":
				device.Product = value
			case "model":
				device.Model = strings.ReplaceAll(value, "_", " ")
			case "device":
				device.Device = value
			case "transport_id":
				device.TransportID = value
			}
		}

		devices = append(devices, device)
	}

	return devices
}

func parseFastbootDevices(output string) []Summary {
	lines := strings.Split(output, "\n")
	devices := make([]Summary, 0)

	for _, rawLine := range lines {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) == 0 {
			continue
		}
		devices = append(devices, Summary{
			Serial: fields[0],
			State:  StateFastboot,
			Mode:   ModeFastboot,
		})
	}

	return devices
}

func parseGetpropOutput(output string) map[string]string {
	properties := make(map[string]string)

	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}

		line = strings.TrimPrefix(line, "[")
		parts := strings.SplitN(line, "]: [", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSuffix(strings.TrimSpace(parts[1]), "]")
		properties[key] = value
	}

	return properties
}

func extractDeviceIPAddress(props map[string]string) string {
	for _, key := range []string{
		"dhcp.wlan0.ipaddress",
		"dhcp.eth0.ipaddress",
		"persist.sys.wifi.ip",
	} {
		if value := strings.TrimSpace(props[key]); value != "" {
			return value
		}
	}
	return ""
}

func extractRootStatus(props map[string]string) string {
	secureValue := strings.TrimSpace(props["ro.secure"])
	debuggableValue := strings.TrimSpace(props["ro.debuggable"])
	buildTags := strings.TrimSpace(props["ro.build.tags"])

	if secureValue == "0" || debuggableValue == "1" || strings.Contains(buildTags, "test-keys") {
		return "Yes"
	}
	return "No"
}

func parseBatteryLevel(output string) string {
	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if !strings.HasPrefix(line, "level:") {
			continue
		}
		value := strings.TrimSpace(strings.TrimPrefix(line, "level:"))
		if value == "" {
			return ""
		}
		return value + "%"
	}
	return ""
}

func parseStorageInfo(output string) string {
	lines := strings.Split(output, "\n")
	for _, rawLine := range lines[1:] {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 5 {
			continue
		}
		total := fields[1]
		used := fields[2]
		available := fields[3]
		usage := fields[4]
		return used + " used / " + total + " total (" + available + " free, " + usage + ")"
	}
	return ""
}

func parseRAMTotal(output string) string {
	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if !strings.HasPrefix(line, "MemTotal:") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 2 {
			return ""
		}
		memTotalKB, err := strconv.ParseFloat(fields[1], 64)
		if err != nil {
			return ""
		}
		memTotalGB := memTotalKB / 1024 / 1024
		return fmt.Sprintf("%.2f GB", memTotalGB)
	}
	return ""
}
