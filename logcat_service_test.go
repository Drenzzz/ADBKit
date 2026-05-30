package main

import (
	"testing"
)

func TestParseLogcatEntry(t *testing.T) {
	tests := []struct {
		name     string
		rawLine  string
		expected LogcatEntry
	}{
		{
			name:    "standard logcat line",
			rawLine: "06-15 10:30:45.123  1234  5678 I ActivityManager: Start proc com.example",
			expected: LogcatEntry{
				Level:     "I",
				Date:      "06-15",
				Time:      "10:30:45.123",
				PID:       "1234",
				TID:       "5678",
				Tag:       "ActivityManager",
				Message:   "Start proc com.example",
				Timestamp: "06-15 10:30:45.123",
			},
		},
		{
			name:    "error level",
			rawLine: "06-15 10:30:45.123  1234  5678 E System.err: java.lang.Exception",
			expected: LogcatEntry{
				Level:     "E",
				Date:      "06-15",
				Time:      "10:30:45.123",
				PID:       "1234",
				TID:       "5678",
				Tag:       "System.err",
				Message:   "java.lang.Exception",
				Timestamp: "06-15 10:30:45.123",
			},
		},
		{
			name:    "message with no tag separator",
			rawLine: "some random text without proper format",
			expected: LogcatEntry{
				Level:   "V",
				Message: "some random text without proper format",
				Raw:     "some random text without proper format",
			},
		},
		{
			name:    "empty line",
			rawLine: "",
			expected: LogcatEntry{
				Level:   "V",
				Message: "",
				Raw:     "",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseLogcatEntry("test-serial", tt.rawLine)

			if result.Level != tt.expected.Level {
				t.Errorf("Level = %q, want %q", result.Level, tt.expected.Level)
			}
			if result.Date != tt.expected.Date {
				t.Errorf("Date = %q, want %q", result.Date, tt.expected.Date)
			}
			if result.Time != tt.expected.Time {
				t.Errorf("Time = %q, want %q", result.Time, tt.expected.Time)
			}
			if result.PID != tt.expected.PID {
				t.Errorf("PID = %q, want %q", result.PID, tt.expected.PID)
			}
			if result.TID != tt.expected.TID {
				t.Errorf("TID = %q, want %q", result.TID, tt.expected.TID)
			}
			if result.Tag != tt.expected.Tag {
				t.Errorf("Tag = %q, want %q", result.Tag, tt.expected.Tag)
			}
			if result.Message != tt.expected.Message {
				t.Errorf("Message = %q, want %q", result.Message, tt.expected.Message)
			}
			if result.Timestamp != tt.expected.Timestamp {
				t.Errorf("Timestamp = %q, want %q", result.Timestamp, tt.expected.Timestamp)
			}
			if result.Serial != "test-serial" {
				t.Errorf("Serial = %q, want %q", result.Serial, "test-serial")
			}
		})
	}
}

func TestBuildLogcatFilterSpec(t *testing.T) {
	tests := []struct {
		name      string
		levels    string
		tagFilter string
		expected  string
	}{
		{
			name:      "empty filters",
			levels:    "",
			tagFilter: "",
			expected:  "",
		},
		{
			name:      "levels only",
			levels:    "W",
			tagFilter: "",
			expected:  "*:W",
		},
		{
			name:      "tag only",
			levels:    "",
			tagFilter: "ActivityManager",
			expected:  "ActivityManager:V",
		},
		{
			name:      "both levels and tag",
			levels:    "E",
			tagFilter: "System.err",
			expected:  "System.err:E",
		},
		{
			name:      "multiple levels",
			levels:    "WE",
			tagFilter: "",
			expected:  "*:WE",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := buildLogcatFilterSpec(tt.levels, tt.tagFilter)
			if result != tt.expected {
				t.Errorf("buildLogcatFilterSpec(%q, %q) = %q, want %q", tt.levels, tt.tagFilter, result, tt.expected)
			}
		})
	}
}

func TestLogcatEventConstants(t *testing.T) {
	if LogcatEventLine != "logcat_line" {
		t.Errorf("LogcatEventLine = %q, want %q", LogcatEventLine, "logcat_line")
	}
	if LogcatEventStatus != "logcat_status" {
		t.Errorf("LogcatEventStatus = %q, want %q", LogcatEventStatus, "logcat_status")
	}
}
