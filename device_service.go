package main

import (
	"context"
	"fmt"
	"strconv"
	"strings"
)

type DeviceMode string

const (
	DeviceModeADB      DeviceMode = "adb"
	DeviceModeFastboot DeviceMode = "fastboot"
	DeviceModeUnknown  DeviceMode = "unknown"
)

type DeviceState string

const (
	DeviceStateReady        DeviceState = "device"
	DeviceStateOffline      DeviceState = "offline"
	DeviceStateUnauthorized DeviceState = "unauthorized"
	DeviceStateRecovery     DeviceState = "recovery"
	DeviceStateSideload     DeviceState = "sideload"
	DeviceStateFastboot     DeviceState = "fastboot"
	DeviceStateUnknown      DeviceState = "unknown"
)

type DeviceSummary struct {
	Serial      string      `json:"serial"`
	State       DeviceState `json:"state"`
	Mode        DeviceMode  `json:"mode"`
	Product     string      `json:"product,omitempty"`
	Model       string      `json:"model,omitempty"`
	Device      string      `json:"device,omitempty"`
	TransportID string      `json:"transportId,omitempty"`
}

type DeviceInfo struct {
	Serial          string      `json:"serial"`
	State           DeviceState `json:"state"`
	Mode            DeviceMode  `json:"mode"`
	Product         string      `json:"product,omitempty"`
	Model           string      `json:"model,omitempty"`
	Device          string      `json:"device,omitempty"`
	Brand           string      `json:"brand,omitempty"`
	Codename        string      `json:"codename,omitempty"`
	Manufacturer    string      `json:"manufacturer,omitempty"`
	AndroidVersion  string      `json:"androidVersion,omitempty"`
	SDKVersion      string      `json:"sdkVersion,omitempty"`
	BuildID         string      `json:"buildId,omitempty"`
	SecurityPatch   string      `json:"securityPatch,omitempty"`
	ABIs            string      `json:"abis,omitempty"`
	TransportID     string      `json:"transportId,omitempty"`
	ConnectionLabel string      `json:"connectionLabel,omitempty"`
	IPAddress       string      `json:"ipAddress,omitempty"`
	RootStatus      string      `json:"rootStatus,omitempty"`
	BatteryLevel    string      `json:"batteryLevel,omitempty"`
	StorageInfo     string      `json:"storageInfo,omitempty"`
	RAMTotal        string      `json:"ramTotal,omitempty"`
}

type DeviceService struct {
	dataDir string
}

func NewDeviceService(dataDir string) *DeviceService {
	return &DeviceService{dataDir: dataDir}
}

func (s *DeviceService) ListDevices(ctx context.Context) ([]DeviceSummary, error) {
	adbDevices, _ := s.listADBDevices(ctx)
	fastbootDevices, _ := s.listFastbootDevices(ctx)

	devices := make([]DeviceSummary, 0, len(adbDevices)+len(fastbootDevices))
	devices = append(devices, adbDevices...)
	devices = append(devices, fastbootDevices...)

	return devices, nil
}

func (s *DeviceService) GetDeviceInfo(ctx context.Context, serial string) (*DeviceInfo, error) {
	devices, err := s.ListDevices(ctx)
	if err != nil {
		return nil, err
	}

	var matched *DeviceSummary
	for i := range devices {
		if devices[i].Serial == serial {
			matched = &devices[i]
			break
		}
	}

	if matched == nil {
		return nil, NewOperationError("get_device_info", "device was not found", fmt.Sprintf("serial '%s' is not connected", serial), true)
	}

	info := &DeviceInfo{
		Serial:      matched.Serial,
		State:       matched.State,
		Mode:        matched.Mode,
		Product:     matched.Product,
		Model:       matched.Model,
		Device:      matched.Device,
		TransportID: matched.TransportID,
	}

	if matched.Mode != DeviceModeADB || matched.State != DeviceStateReady {
		info.ConnectionLabel = string(matched.Mode)
		return info, nil
	}

	props, err := s.getDeviceProperties(ctx, matched.Serial)
	if err == nil {
		info.Manufacturer = props["ro.product.manufacturer"]
		info.Brand = props["ro.product.brand"]
		info.AndroidVersion = props["ro.build.version.release"]
		info.SDKVersion = props["ro.build.version.sdk"]
		info.BuildID = props["ro.build.display.id"]
		info.SecurityPatch = props["ro.build.version.security_patch"]
		info.ABIs = props["ro.product.cpu.abilist"]
		info.ConnectionLabel = props["ro.product.name"]
		info.Codename = props["ro.product.device"]

		if info.Product == "" {
			info.Product = props["ro.product.name"]
		}
		if info.Model == "" {
			info.Model = props["ro.product.model"]
		}
		if info.Device == "" {
			info.Device = props["ro.product.device"]
		}

		info.IPAddress = extractDeviceIPAddress(props)
		info.RootStatus = extractRootStatus(props)
	}

	batteryLevel, err := s.getBatteryLevel(ctx, matched.Serial)
	if err == nil {
		info.BatteryLevel = batteryLevel
	}

	storageInfo, err := s.getStorageInfo(ctx, matched.Serial)
	if err == nil {
		info.StorageInfo = storageInfo
	}

	ramTotal, err := s.getRAMTotal(ctx, matched.Serial)
	if err == nil {
		info.RAMTotal = ramTotal
	}

	return info, nil
}

func (s *DeviceService) DetectDeviceMode(ctx context.Context, serial string) (DeviceMode, error) {
	devices, err := s.ListDevices(ctx)
	if err != nil {
		return DeviceModeUnknown, err
	}

	for _, device := range devices {
		if device.Serial == serial {
			return device.Mode, nil
		}
	}

	return DeviceModeUnknown, NewOperationError("detect_device_mode", "device mode could not be determined", fmt.Sprintf("serial '%s' is not connected", serial), true)
}

func (s *DeviceService) RebootDevice(ctx context.Context, serial string, mode string) (string, error) {
	if serial == "" {
		return "", NewOperationError("reboot_device", "device serial is required", "serial must not be empty", false)
	}

	mode = strings.TrimSpace(mode)

	connectionMode, err := s.DetectDeviceMode(ctx, serial)
	if err != nil {
		return "", err
	}

	switch connectionMode {
	case DeviceModeADB:
		args := []string{"-s", serial, "reboot"}
		if mode != "" {
			args = append(args, mode)
		}
		result, err := RunCommand(ctx, ExecRequest{
			Command: BinaryNameAdb,
			Args:    args,
			Timeout: 10e9,
		})
		if err != nil {
			return "", NewOperationError("reboot_device", "failed to reboot device", err.Error(), true)
		}
		if result.ExitCode != 0 {
			return "", NewOperationError("reboot_device", "reboot command failed", strings.TrimSpace(result.Stderr), true)
		}
		return fmt.Sprintf("Reboot command sent to %s (%s)", serial, mode), nil

	case DeviceModeFastboot:
		args := []string{"reboot"}
		if mode != "" {
			args = append(args, mode)
		}
		result, err := RunCommand(ctx, ExecRequest{
			Command: BinaryNameFastboot,
			Args:    args,
			Timeout: 10e9,
		})
		if err != nil {
			return "", NewOperationError("reboot_device", "failed to reboot device", err.Error(), true)
		}
		if result.ExitCode != 0 {
			return "", NewOperationError("reboot_device", "reboot command failed", strings.TrimSpace(result.Stderr), true)
		}
		return fmt.Sprintf("Reboot command sent to %s (%s)", serial, mode), nil

	default:
		return "", NewOperationError("reboot_device", "no connected device detected in adb or fastboot mode", fmt.Sprintf("serial '%s' mode is %s", serial, connectionMode), true)
	}
}

func (s *DeviceService) listADBDevices(ctx context.Context) ([]DeviceSummary, error) {
	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"devices", "-l"},
		Timeout: 5e9,
	})
	if err != nil {
		return nil, NewOperationError("list_adb_devices", "failed to list ADB devices", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return nil, NewOperationError("list_adb_devices", "adb devices failed", strings.TrimSpace(result.Stderr), true)
	}

	return parseADBDevices(result.Stdout), nil
}

func (s *DeviceService) listFastbootDevices(ctx context.Context) ([]DeviceSummary, error) {
	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameFastboot,
		Args:    []string{"devices"},
		Timeout: 5e9,
	})
	if err != nil {
		return nil, nil
	}
	if result.ExitCode != 0 {
		return nil, nil
	}

	return parseFastbootDevices(result.Stdout), nil
}

func (s *DeviceService) getDeviceProperties(ctx context.Context, serial string) (map[string]string, error) {
	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "getprop"},
		Timeout: 10e9,
	})
	if err != nil {
		return nil, err
	}
	return parseGetpropOutput(result.Stdout), nil
}

func (s *DeviceService) getBatteryLevel(ctx context.Context, serial string) (string, error) {
	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "dumpsys", "battery"},
		Timeout: 5e9,
	})
	if err != nil {
		return "", err
	}
	return parseBatteryLevel(result.Stdout), nil
}

func (s *DeviceService) getStorageInfo(ctx context.Context, serial string) (string, error) {
	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "df", "/data"},
		Timeout: 5e9,
	})
	if err != nil {
		return "", err
	}
	return parseStorageInfo(result.Stdout), nil
}

func (s *DeviceService) getRAMTotal(ctx context.Context, serial string) (string, error) {
	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "cat", "/proc/meminfo"},
		Timeout: 5e9,
	})
	if err != nil {
		return "", err
	}
	return parseRAMTotal(result.Stdout), nil
}

func parseADBDevices(output string) []DeviceSummary {
	lines := strings.Split(output, "\n")
	devices := make([]DeviceSummary, 0)

	for _, rawLine := range lines {
		line := strings.TrimSpace(rawLine)
		if line == "" || strings.HasPrefix(line, "List of devices attached") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}

		device := DeviceSummary{
			Serial: fields[0],
			State:  DeviceState(fields[1]),
			Mode:   DeviceModeADB,
		}

		if device.State != DeviceStateReady && device.State != DeviceStateOffline &&
			device.State != DeviceStateUnauthorized && device.State != DeviceStateRecovery &&
			device.State != DeviceStateSideload {
			device.State = DeviceStateUnknown
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

func parseFastbootDevices(output string) []DeviceSummary {
	lines := strings.Split(output, "\n")
	devices := make([]DeviceSummary, 0)

	for _, rawLine := range lines {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) == 0 {
			continue
		}
		devices = append(devices, DeviceSummary{
			Serial: fields[0],
			State:  DeviceStateFastboot,
			Mode:   DeviceModeFastboot,
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
		return fmt.Sprintf("%s used / %s total (%s free, %s)", used, total, available, usage)
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
