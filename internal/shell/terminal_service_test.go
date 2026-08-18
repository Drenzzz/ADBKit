package shell

import (
	"ADBKit/internal/core"
	"reflect"
	"testing"
)

func TestTerminalBinaryName(t *testing.T) {
	if got := terminalBinaryName(ModeFastboot); got != core.BinaryNameFastboot {
		t.Fatalf("fastboot mode resolved binary %q, want %q", got, core.BinaryNameFastboot)
	}
	if got := terminalBinaryName(ModeShell); got != core.BinaryNameAdb {
		t.Fatalf("shell mode resolved binary %q, want %q", got, core.BinaryNameAdb)
	}
}

func TestBuildTerminalCommandArgs(t *testing.T) {
	tests := []struct {
		name   string
		mode   string
		serial string
		input  []string
		want   []string
	}{
		{
			name:   "fastboot targets selected device",
			mode:   ModeFastboot,
			serial: "FASTBOOT-001",
			input:  []string{"getvar", "all"},
			want:   []string{"-s", "FASTBOOT-001", "getvar", "all"},
		},
		{
			name:   "adb shell keeps shell subcommand",
			mode:   ModeShell,
			serial: "ADB-001",
			input:  []string{"getprop"},
			want:   []string{"-s", "ADB-001", "shell", "getprop"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := buildTerminalCommandArgs(tt.mode, tt.serial, tt.input); !reflect.DeepEqual(got, tt.want) {
				t.Fatalf("args = %#v, want %#v", got, tt.want)
			}
		})
	}
}
