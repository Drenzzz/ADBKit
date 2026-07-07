package device

import (
	"testing"
)

func TestParseADBDevices(t *testing.T) {
	t.Run("empty output", func(t *testing.T) {
		devices := parseADBDevices("")
		if len(devices) != 0 {
			t.Errorf("expected 0 devices, got %d", len(devices))
		}
	})

	t.Run("header only", func(t *testing.T) {
		output := "List of devices attached\n"
		devices := parseADBDevices(output)
		if len(devices) != 0 {
			t.Errorf("expected 0 devices, got %d", len(devices))
		}
	})

	t.Run("single device ready", func(t *testing.T) {
		output := "List of devices attached\nABC12345\tdevice\n"
		devices := parseADBDevices(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if devices[0].Serial != "ABC12345" {
			t.Errorf("expected serial 'ABC12345', got %q", devices[0].Serial)
		}
		if devices[0].State != StateReady {
			t.Errorf("expected state 'device', got %q", devices[0].State)
		}
		if devices[0].Mode != ModeADB {
			t.Errorf("expected mode 'adb', got %q", devices[0].Mode)
		}
	})

	t.Run("device offline", func(t *testing.T) {
		output := "ABC12345\toffline\n"
		devices := parseADBDevices(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if devices[0].State != StateOffline {
			t.Errorf("expected state 'offline', got %q", devices[0].State)
		}
	})

	t.Run("device unauthorized", func(t *testing.T) {
		output := "ABC12345\tunauthorized\n"
		devices := parseADBDevices(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if devices[0].State != StateUnauthorized {
			t.Errorf("expected state 'unauthorized', got %q", devices[0].State)
		}
	})

	t.Run("device recovery", func(t *testing.T) {
		output := "ABC12345\trecovery\n"
		devices := parseADBDevices(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if devices[0].State != StateRecovery {
			t.Errorf("expected state 'recovery', got %q", devices[0].State)
		}
	})

	t.Run("device sideload", func(t *testing.T) {
		output := "ABC12345\tsideload\n"
		devices := parseADBDevices(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if devices[0].State != StateSideload {
			t.Errorf("expected state 'sideload', got %q", devices[0].State)
		}
	})

	t.Run("unknown state becomes unknown", func(t *testing.T) {
		output := "ABC12345\tbootloader\n"
		devices := parseADBDevices(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if devices[0].State != StateUnknown {
			t.Errorf("expected state 'unknown', got %q", devices[0].State)
		}
	})

	t.Run("multiple devices", func(t *testing.T) {
		output := "List of devices attached\nDEV001\tdevice\nDEV002\tdevice\nDEV003\toffline\n"
		devices := parseADBDevices(output)
		if len(devices) != 3 {
			t.Fatalf("expected 3 devices, got %d", len(devices))
		}
	})

	t.Run("parses extras product model device", func(t *testing.T) {
		output := "ABC12345\tdevice product:fox_peridot model:POCO_F6 device:peridot transport_id:5\n"
		devices := parseADBDevices(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		d := devices[0]
		if d.Product != "fox_peridot" {
			t.Errorf("expected product 'fox_peridot', got %q", d.Product)
		}
		if d.Model != "POCO F6" {
			t.Errorf("expected model 'POCO F6', got %q", d.Model)
		}
		if d.Device != "peridot" {
			t.Errorf("expected device 'peridot', got %q", d.Device)
		}
		if d.TransportID != "5" {
			t.Errorf("expected transport_id '5', got %q", d.TransportID)
		}
	})

	t.Run("skips lines with fewer than 2 fields", func(t *testing.T) {
		output := "List of devices attached\nABC\n"
		devices := parseADBDevices(output)
		if len(devices) != 0 {
			t.Errorf("expected 0 devices, got %d", len(devices))
		}
	})
}

func TestDeviceStates(t *testing.T) {
	if StateReady != "device" {
		t.Errorf("StateReady = %q, want 'device'", StateReady)
	}
	if StateOffline != "offline" {
		t.Errorf("StateOffline = %q, want 'offline'", StateOffline)
	}
	if StateUnauthorized != "unauthorized" {
		t.Errorf("StateUnauthorized = %q, want 'unauthorized'", StateUnauthorized)
	}
	if StateRecovery != "recovery" {
		t.Errorf("StateRecovery = %q, want 'recovery'", StateRecovery)
	}
	if StateSideload != "sideload" {
		t.Errorf("StateSideload = %q, want 'sideload'", StateSideload)
	}
	if StateFastboot != "fastboot" {
		t.Errorf("StateFastboot = %q, want 'fastboot'", StateFastboot)
	}
	if ModeADB != "adb" {
		t.Errorf("ModeADB = %q, want 'adb'", ModeADB)
	}
	if ModeFastboot != "fastboot" {
		t.Errorf("ModeFastboot = %q, want 'fastboot'", ModeFastboot)
	}
}
