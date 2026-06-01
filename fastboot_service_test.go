package main

import (
	"testing"
)

func TestParseFastbootDeviceInfos_Empty(t *testing.T) {
	devices := parseFastbootDeviceInfos("")
	if len(devices) != 0 {
		t.Errorf("expected 0 devices, got %d", len(devices))
	}
}

func TestParseFastbootDeviceInfos_SingleDevice(t *testing.T) {
	output := "ABC12345\tfastboot\n"
	devices := parseFastbootDeviceInfos(output)
	if len(devices) != 1 {
		t.Fatalf("expected 1 device, got %d", len(devices))
	}
	if devices[0].Serial != "ABC12345" {
		t.Errorf("expected serial ABC12345, got %q", devices[0].Serial)
	}
	if devices[0].State != DeviceStateFastboot {
		t.Errorf("expected state fastboot, got %q", devices[0].State)
	}
	if devices[0].Mode != DeviceModeFastboot {
		t.Errorf("expected mode fastboot, got %q", devices[0].Mode)
	}
}

func TestParseFastbootDeviceInfos_MultipleDevices(t *testing.T) {
	output := "DEV1\tfastboot\nDEV2\tbootloader\nDEV3\trecovery\n"
	devices := parseFastbootDeviceInfos(output)
	if len(devices) != 3 {
		t.Fatalf("expected 3 devices, got %d", len(devices))
	}
	if devices[1].State != DeviceStateFastboot {
		t.Errorf("bootloader should map to fastboot state, got %q", devices[1].State)
	}
	if devices[2].State != DeviceStateRecovery {
		t.Errorf("recovery should map to recovery state, got %q", devices[2].State)
	}
	if devices[2].Mode != DeviceModeADB {
		t.Errorf("recovery should have adb mode, got %q", devices[2].Mode)
	}
}

func TestParseFastbootDeviceInfos_Sideload(t *testing.T) {
	output := "DEV1\tsideload\n"
	devices := parseFastbootDeviceInfos(output)
	if len(devices) != 1 {
		t.Fatalf("expected 1 device, got %d", len(devices))
	}
	if devices[0].State != DeviceStateSideload {
		t.Errorf("expected state sideload, got %q", devices[0].State)
	}
	if devices[0].Mode != DeviceModeADB {
		t.Errorf("sideload should have adb mode, got %q", devices[0].Mode)
	}
}

func TestParseCurrentSlot_Found(t *testing.T) {
	output := "current-slot: a\n"
	slot, err := parseCurrentSlot(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if slot != "a" {
		t.Errorf("expected slot a, got %q", slot)
	}
}

func TestParseCurrentSlot_InStderr(t *testing.T) {
	// fastboot outputs current-slot to stderr on some devices
	output := "some log\ncurrent-slot: b\n"
	slot, err := parseCurrentSlot(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if slot != "b" {
		t.Errorf("expected slot b, got %q", slot)
	}
}

func TestParseCurrentSlot_NotFound(t *testing.T) {
	output := "random output\nno slot here\n"
	_, err := parseCurrentSlot(output)
	if err == nil {
		t.Fatal("expected error when slot not found")
	}
}

func TestNormalizeFastbootArgs_Empty(t *testing.T) {
	_, err := normalizeFastbootArgs("")
	if err == nil {
		t.Fatal("expected error for empty args")
	}
}

func TestNormalizeFastbootArgs_ShellOperators(t *testing.T) {
	tests := []string{
		"getvar all; rm -rf /",
		"getvar all && echo hacked",
		"getvar all | cat /etc/passwd",
		"getvar all > /tmp/out",
		"getvar all < /dev/null",
		"echo test >> file",
	}
	for _, tt := range tests {
		_, err := normalizeFastbootArgs(tt)
		if err == nil {
			t.Errorf("expected error for args with shell operator: %q", tt)
		}
	}
}

func TestNormalizeFastbootArgs_Valid(t *testing.T) {
	args, err := normalizeFastbootArgs("getvar all")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(args) != 2 || args[0] != "getvar" || args[1] != "all" {
		t.Errorf("unexpected args: %v", args)
	}
}

func TestNormalizeFastbootArgs_MultipleArgs(t *testing.T) {
	args, err := normalizeFastbootArgs("flash boot /path/to/boot.img")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(args) != 3 {
		t.Errorf("expected 3 args, got %d", len(args))
	}
}

func TestFastbootDeviceInfoJSON(t *testing.T) {
	d := FastbootDeviceInfo{
		Serial: "ABC123",
		State:  DeviceStateFastboot,
		Mode:   DeviceModeFastboot,
	}
	if d.Serial != "ABC123" {
		t.Errorf("expected serial ABC123, got %q", d.Serial)
	}
}
