package main

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestParseADBDevices(t *testing.T) {
	output := `List of devices attached
emulator-5554          device product:sdk_gphone64_x86_64 model:sdk_gphone64_x86_64 device:emu64xa transport_id:1
ZX1G22BQQP             unauthorized transport_id:2
R58M31XXXX             offline transport_id:3
RECOVERY123            recovery
9e59545d               sideload
`

	devices := parseADBDevices(output)
	if len(devices) != 5 {
		t.Fatalf("expected 5 devices, got %d", len(devices))
	}

	if devices[0].Mode != DeviceModeADB || devices[0].State != DeviceStateReady {
		t.Fatalf("expected first device to be ready adb, got mode=%s state=%s", devices[0].Mode, devices[0].State)
	}

	if devices[0].TransportID != "1" {
		t.Fatalf("expected transport id 1, got %s", devices[0].TransportID)
	}

	if devices[0].Product != "sdk_gphone64_x86_64" {
		t.Fatalf("expected product sdk_gphone64_x86_64, got %s", devices[0].Product)
	}

	if devices[0].Model != "sdk gphone64 x86 64" {
		t.Fatalf("expected model sdk gphone64 x86 64, got %s", devices[0].Model)
	}

	if devices[1].State != DeviceStateUnauthorized {
		t.Fatalf("expected unauthorized state, got %s", devices[1].State)
	}

	if devices[2].State != DeviceStateOffline {
		t.Fatalf("expected offline state, got %s", devices[2].State)
	}

	if devices[3].State != DeviceStateRecovery {
		t.Fatalf("expected recovery state, got %s", devices[3].State)
	}

	if devices[4].State != DeviceStateSideload {
		t.Fatalf("expected sideload state, got %s", devices[4].State)
	}
}

func TestParseADBDevices_Empty(t *testing.T) {
	output := "List of devices attached\n\n"
	devices := parseADBDevices(output)
	if len(devices) != 0 {
		t.Fatalf("expected 0 devices, got %d", len(devices))
	}
}

func TestParseFastbootDevices(t *testing.T) {
	output := "ABC123\tfastboot\nXYZ987\tfastboot\n"
	devices := parseFastbootDevices(output)

	if len(devices) != 2 {
		t.Fatalf("expected 2 devices, got %d", len(devices))
	}

	if devices[0].Serial != "ABC123" {
		t.Fatalf("expected serial ABC123, got %s", devices[0].Serial)
	}

	if devices[0].Mode != DeviceModeFastboot || devices[0].State != DeviceStateFastboot {
		t.Fatalf("expected fastboot device, got mode=%s state=%s", devices[0].Mode, devices[0].State)
	}
}

func TestParseFastbootDevices_Empty(t *testing.T) {
	devices := parseFastbootDevices("")
	if len(devices) != 0 {
		t.Fatalf("expected 0 devices, got %d", len(devices))
	}
}

func TestParseGetpropOutput(t *testing.T) {
	output := `[ro.product.manufacturer]: [Google]
[ro.product.brand]: [Pixel]
[dhcp.wlan0.ipaddress]: [192.168.1.24]
[ro.secure]: [1]
[ro.debuggable]: [0]
[ro.build.version.release]: [14]
[ro.product.cpu.abilist]: [arm64-v8a,armeabi-v7a]
`

	props := parseGetpropOutput(output)

	if props["ro.product.manufacturer"] != "Google" {
		t.Fatalf("expected manufacturer Google, got %s", props["ro.product.manufacturer"])
	}

	if props["ro.build.version.release"] != "14" {
		t.Fatalf("expected Android version 14, got %s", props["ro.build.version.release"])
	}

	if props["ro.product.cpu.abilist"] != "arm64-v8a,armeabi-v7a" {
		t.Fatalf("expected ABI list, got %s", props["ro.product.cpu.abilist"])
	}
}

func TestExtractDeviceIPAddress(t *testing.T) {
	props := map[string]string{
		"dhcp.wlan0.ipaddress": "192.168.1.24",
	}

	if ip := extractDeviceIPAddress(props); ip != "192.168.1.24" {
		t.Fatalf("expected ip address 192.168.1.24, got %s", ip)
	}
}

func TestExtractDeviceIPAddress_Fallback(t *testing.T) {
	props := map[string]string{
		"dhcp.eth0.ipaddress": "10.0.0.5",
	}

	if ip := extractDeviceIPAddress(props); ip != "10.0.0.5" {
		t.Fatalf("expected ip address 10.0.0.5, got %s", ip)
	}
}

func TestExtractDeviceIPAddress_Empty(t *testing.T) {
	props := map[string]string{}
	if ip := extractDeviceIPAddress(props); ip != "" {
		t.Fatalf("expected empty ip, got %s", ip)
	}
}

func TestExtractRootStatus(t *testing.T) {
	rootedProps := map[string]string{
		"ro.secure":     "0",
		"ro.debuggable": "1",
	}
	if status := extractRootStatus(rootedProps); status != "Yes" {
		t.Fatalf("expected rooted status Yes, got %s", status)
	}

	nonRootedProps := map[string]string{
		"ro.secure":     "1",
		"ro.debuggable": "0",
	}
	if status := extractRootStatus(nonRootedProps); status != "No" {
		t.Fatalf("expected rooted status No, got %s", status)
	}

	testKeysProps := map[string]string{
		"ro.secure":     "1",
		"ro.debuggable": "0",
		"ro.build.tags": "test-keys",
	}
	if status := extractRootStatus(testKeysProps); status != "Yes" {
		t.Fatalf("expected rooted status Yes for test-keys, got %s", status)
	}
}

func TestParseBatteryLevel(t *testing.T) {
	output := "AC powered: false\nlevel: 87\nstatus: 3\n"
	if batteryLevel := parseBatteryLevel(output); batteryLevel != "87%" {
		t.Fatalf("expected battery level 87%%, got %s", batteryLevel)
	}
}

func TestParseBatteryLevel_Empty(t *testing.T) {
	if batteryLevel := parseBatteryLevel(""); batteryLevel != "" {
		t.Fatalf("expected empty battery level, got %s", batteryLevel)
	}
}

func TestParseStorageInfo(t *testing.T) {
	output := "Filesystem     1K-blocks    Used Available Use% Mounted on\n/data           5851136 2039488   3746100  36% /data\n"
	if storageInfo := parseStorageInfo(output); storageInfo != "2039488 used / 5851136 total (3746100 free, 36%)" {
		t.Fatalf("unexpected storage info: %s", storageInfo)
	}
}

func TestParseStorageInfo_Empty(t *testing.T) {
	if storageInfo := parseStorageInfo(""); storageInfo != "" {
		t.Fatalf("expected empty storage info, got %s", storageInfo)
	}
}

func TestParseRAMTotal(t *testing.T) {
	output := "MemTotal:        8192000 kB\nMemFree:         1024000 kB\n"
	if ramTotal := parseRAMTotal(output); ramTotal != "7.81 GB" {
		t.Fatalf("unexpected RAM total: %s", ramTotal)
	}
}

func TestParseRAMTotal_Empty(t *testing.T) {
	if ramTotal := parseRAMTotal(""); ramTotal != "" {
		t.Fatalf("expected empty RAM total, got %s", ramTotal)
	}
}

func TestRebootDevice_SerialRequired(t *testing.T) {
	s := NewDeviceService(t.TempDir())
	_, err := s.RebootDevice(context.Background(), "", "system")
	if err == nil {
		t.Fatal("expected error for empty serial")
	}
}

func TestRebootDevice_UnsupportedMode(t *testing.T) {
	s := NewDeviceService(t.TempDir())
	_, err := s.RebootDevice(context.Background(), "SER123", "invalid")
	if err == nil {
		t.Fatal("expected error for unsupported mode")
	}
}

func TestRebootDevice_FastbootMode(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-based adb stub not supported on windows")
	}

	tempDir := t.TempDir()
	invocationPath := filepath.Join(tempDir, "adb-invocation.txt")
	adbPath := filepath.Join(tempDir, "adb")

	// Stub handles two invocations: adb devices -l and adb -s SER123 reboot fastboot
	script := `#!/bin/sh
if [ "$1" = "devices" ]; then
  printf 'SER123\tfastboot\n'
else
  printf '%s\n' "$@" >> "$ADB_TEST_OUTPUT"
fi
`
	if err := os.WriteFile(adbPath, []byte(script), 0o755); err != nil {
		t.Fatalf("failed to create adb stub: %v", err)
	}

	t.Setenv("PATH", tempDir+string(os.PathListSeparator)+os.Getenv("PATH"))
	t.Setenv("ADB_TEST_OUTPUT", invocationPath)

	s := NewDeviceService(t.TempDir())
	message, err := s.RebootDevice(context.Background(), "SER123", "fastboot")
	if err != nil {
		t.Fatalf("expected reboot command to succeed, got error: %v", err)
	}

	if message != "Reboot command sent to SER123 (fastboot)" {
		t.Fatalf("unexpected success message: %s", message)
	}

	rawInvocation, err := os.ReadFile(invocationPath)
	if err != nil {
		t.Fatalf("failed to read adb invocation: %v", err)
	}

	invocation := strings.TrimSpace(string(rawInvocation))
	if invocation != "-s\nSER123\nreboot\nfastboot" {
		t.Fatalf("unexpected adb invocation: %q", invocation)
	}
}

func TestRebootDevice_ADBMode(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell-based adb stub not supported on windows")
	}

	tempDir := t.TempDir()
	invocationPath := filepath.Join(tempDir, "adb-invocation.txt")
	adbPath := filepath.Join(tempDir, "adb")

	script := `#!/bin/sh
if [ "$1" = "devices" ]; then
  printf 'SER123\tdevice\n'
else
  printf '%s\n' "$@" >> "$ADB_TEST_OUTPUT"
fi
`
	if err := os.WriteFile(adbPath, []byte(script), 0o755); err != nil {
		t.Fatalf("failed to create adb stub: %v", err)
	}

	t.Setenv("PATH", tempDir+string(os.PathListSeparator)+os.Getenv("PATH"))
	t.Setenv("ADB_TEST_OUTPUT", invocationPath)

	s := NewDeviceService(t.TempDir())
	message, err := s.RebootDevice(context.Background(), "SER123", "recovery")
	if err != nil {
		t.Fatalf("expected reboot command to succeed, got error: %v", err)
	}

	if message != "Reboot command sent to SER123 (recovery)" {
		t.Fatalf("unexpected success message: %s", message)
	}

	rawInvocation, err := os.ReadFile(invocationPath)
	if err != nil {
		t.Fatalf("failed to read adb invocation: %v", err)
	}

	invocation := strings.TrimSpace(string(rawInvocation))
	if invocation != "-s\nSER123\nreboot\nrecovery" {
		t.Fatalf("unexpected adb invocation: %q", invocation)
	}
}
