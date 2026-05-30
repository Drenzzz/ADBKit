package main

import (
	"testing"
)

func TestSplitTerminalArgs(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "empty string",
			input:    "",
			expected: nil,
		},
		{
			name:     "whitespace only",
			input:    "   ",
			expected: nil,
		},
		{
			name:     "single command",
			input:    "ls",
			expected: []string{"ls"},
		},
		{
			name:     "command with args",
			input:    "ls -la /sdcard",
			expected: []string{"ls", "-la", "/sdcard"},
		},
		{
			name:     "multiple spaces",
			input:    "ls   -la   /sdcard",
			expected: []string{"ls", "-la", "/sdcard"},
		},
		{
			name:     "leading/trailing spaces",
			input:    "  ls -la  ",
			expected: []string{"ls", "-la"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := splitTerminalArgs(tt.input)
			if len(result) != len(tt.expected) {
				t.Errorf("splitTerminalArgs(%q) = %v, want %v", tt.input, result, tt.expected)
				return
			}
			for i, v := range result {
				if v != tt.expected[i] {
					t.Errorf("splitTerminalArgs(%q)[%d] = %q, want %q", tt.input, i, v, tt.expected[i])
				}
			}
		})
	}
}

func TestTerminalModes(t *testing.T) {
	if TerminalModeShell != "adb-shell" {
		t.Errorf("TerminalModeShell = %q, want %q", TerminalModeShell, "adb-shell")
	}
	if TerminalModeADBHost != "adb-host" {
		t.Errorf("TerminalModeADBHost = %q, want %q", TerminalModeADBHost, "adb-host")
	}
	if TerminalModeFastboot != "fastboot-host" {
		t.Errorf("TerminalModeFastboot = %q, want %q", TerminalModeFastboot, "fastboot-host")
	}
}

func TestTerminalEventConstants(t *testing.T) {
	if TerminalEventOutput != "terminal_output" {
		t.Errorf("TerminalEventOutput = %q, want %q", TerminalEventOutput, "terminal_output")
	}
	if TerminalEventClosed != "terminal_closed" {
		t.Errorf("TerminalEventClosed = %q, want %q", TerminalEventClosed, "terminal_closed")
	}
}
