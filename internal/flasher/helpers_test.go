package flasher

import (
	"testing"
)

func TestNormalizeFastbootArgs(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    []string
		wantErr bool
	}{
		{"empty string", "", nil, true},
		{"whitespace only", "   ", nil, true},
		{"single arg", "getvar:all", []string{"getvar:all"}, false},
		{"multiple args", "flash boot boot.img", []string{"flash", "boot", "boot.img"}, false},
		{"blocked ampersand", "flash boot & rm -rf /", nil, true},
		{"blocked pipe", "flash boot | cat", nil, true},
		{"blocked semicolon", "flash boot; ls", nil, true},
		{"blocked greater than", "flash boot > file", nil, true},
		{"blocked less than", "flash boot < file", nil, true},
		{"blocked backtick", "flash boot `id`", nil, true},
		{"blocked dollar", "flash boot $HOME", nil, true},
		{"normal fastboot continue", "continue", []string{"continue"}, false},
		{"normal getvar", "getvar:slot-count", []string{"getvar:slot-count"}, false},
		{"flash with path", "flash boot_a /tmp/boot.img", []string{"flash", "boot_a", "/tmp/boot.img"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := normalizeFastbootArgs(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("normalizeFastbootArgs(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}
			if len(got) != len(tt.want) {
				t.Fatalf("normalizeFastbootArgs(%q) returned %d args, want %d", tt.input, len(got), len(tt.want))
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Errorf("arg[%d] = %q, want %q", i, got[i], tt.want[i])
				}
			}
		})
	}
}

func TestParseFastbootDeviceInfos(t *testing.T) {
	t.Run("empty output", func(t *testing.T) {
		devices := parseFastbootDeviceInfos("")
		if len(devices) != 0 {
			t.Errorf("expected 0 devices, got %d", len(devices))
		}
	})

	t.Run("single fastboot device", func(t *testing.T) {
		output := "ABC12345\tfastboot"
		devices := parseFastbootDeviceInfos(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if devices[0].Serial != "ABC12345" {
			t.Errorf("expected serial 'ABC12345', got %q", devices[0].Serial)
		}
		if string(devices[0].State) != "fastboot" {
			t.Errorf("expected state 'fastboot', got %q", devices[0].State)
		}
	})

	t.Run("multiple devices", func(t *testing.T) {
		output := "DEV001\tfastboot\nDEV002\tbootloader"
		devices := parseFastbootDeviceInfos(output)
		if len(devices) != 2 {
			t.Fatalf("expected 2 devices, got %d", len(devices))
		}
	})

	t.Run("recovery state", func(t *testing.T) {
		output := "DEV001\trecovery"
		devices := parseFastbootDeviceInfos(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if string(devices[0].State) != "recovery" {
			t.Errorf("expected state 'recovery', got %q", devices[0].State)
		}
	})

	t.Run("offline state", func(t *testing.T) {
		output := "DEV001\toffline"
		devices := parseFastbootDeviceInfos(output)
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if string(devices[0].State) != "offline" {
			t.Errorf("expected state 'offline', got %q", devices[0].State)
		}
	})
}

func TestParseCurrentSlot(t *testing.T) {
	t.Run("found slot a", func(t *testing.T) {
		output := "current-slot: a\n"
		slot, err := parseCurrentSlot(output)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if slot != "a" {
			t.Errorf("expected 'a', got %q", slot)
		}
	})

	t.Run("found slot b", func(t *testing.T) {
		output := "current-slot: b\n"
		slot, err := parseCurrentSlot(output)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if slot != "b" {
			t.Errorf("expected 'b', got %q", slot)
		}
	})

	t.Run("not found", func(t *testing.T) {
		output := "some other output\n"
		_, err := parseCurrentSlot(output)
		if err == nil {
			t.Fatal("expected error for missing slot")
		}
	})

	t.Run("empty slot value", func(t *testing.T) {
		output := "current-slot: \n"
		_, err := parseCurrentSlot(output)
		if err == nil {
			t.Fatal("expected error for empty slot")
		}
	})
}

func TestExtractErrorDetail(t *testing.T) {
	t.Run("nil result with error", func(t *testing.T) {
		result := extractErrorDetail(nil, nil)
		if result != "" {
			t.Errorf("expected empty string, got %q", result)
		}
	})
}

func TestSuccessMessage(t *testing.T) {
	t.Run("uses stdout when available", func(t *testing.T) {
		msg := successMessage("OK done", "fallback")
		if msg != "OK done" {
			t.Errorf("expected 'OK done', got %q", msg)
		}
	})

	t.Run("uses fallback when stdout empty", func(t *testing.T) {
		msg := successMessage("", "fallback msg")
		if msg != "fallback msg" {
			t.Errorf("expected 'fallback msg', got %q", msg)
		}
	})
}
