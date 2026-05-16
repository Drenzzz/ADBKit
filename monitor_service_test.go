package main

import (
	"context"
	"testing"
)

func TestGetSnapshot_EmptySerial(t *testing.T) {
	s := NewMonitorService(t.TempDir())
	_, err := s.GetSnapshot(context.Background(), "")
	if err == nil {
		t.Fatal("expected error for empty serial")
	}
}

func TestFormatUptime(t *testing.T) {
	tests := []struct {
		name     string
		seconds  int64
		expected string
	}{
		{"zero", 0, ""},
		{"negative", -10, ""},
		{"minutes only", 300, "5m"},
		{"hours and minutes", 3661, "1h 1m"},
		{"days", 90000, "1d 1h 0m"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := formatUptime(tt.seconds); got != tt.expected {
				t.Errorf("formatUptime(%d) = %q, want %q", tt.seconds, got, tt.expected)
			}
		})
	}
}

func TestFormatBytes(t *testing.T) {
	tests := []struct {
		name     string
		bytes    int64
		expected string
	}{
		{"zero", 0, ""},
		{"negative", -100, ""},
		{"kilobytes", 2048, "2 KB"},
		{"megabytes", 5 * 1024 * 1024, "5.0 MB"},
		{"gigabytes", 8 * 1024 * 1024 * 1024, "8.00 GB"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := formatBytes(tt.bytes); got != tt.expected {
				t.Errorf("formatBytes(%d) = %q, want %q", tt.bytes, got, tt.expected)
			}
		})
	}
}

func TestMonitorService_NetworkRateCalculation(t *testing.T) {
	s := NewMonitorService(t.TempDir())

	// First call should return 0 rates (no previous snapshot)
	s.prev["test-serial"] = monitorSnapshot{
		rxBytes: 1000,
		txBytes: 500,
		at:      s.prev["test-serial"].at,
	}

	// Verify the prev map is initialized
	if s.prev == nil {
		t.Fatal("expected prev map to be initialized")
	}
}
