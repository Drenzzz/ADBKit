package shell

import "testing"

func TestBuildLogcatFilterSpec(t *testing.T) {
	cases := []struct {
		name     string
		levels   string
		tag      string
		expected string
	}{
		{"empty both", "", "", ""},
		{"only levels", "W", "", "*:W"},
		{"only tag", "", "MyTag", "MyTag:V"},
		{"both", "E", "MyTag", "MyTag:E"},
		{"levels lowercased to upper", "w", "MyTag", "MyTag:W"},
		{"levels trimmed", "  E  ", "MyTag", "MyTag:E"},
		{"tag trimmed", "I", "  MyTag  ", "MyTag:I"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := buildLogcatFilterSpec(c.levels, c.tag)
			if got != c.expected {
				t.Errorf("buildLogcatFilterSpec(%q, %q) = %q, want %q", c.levels, c.tag, got, c.expected)
			}
		})
	}
}

func TestParseLogcatEntry_AllLevels(t *testing.T) {
	cases := []struct {
		level   string
		message string
	}{
		{"V", "verbose"},
		{"D", "debug"},
		{"I", "info"},
		{"W", "warn"},
		{"E", "error"},
		{"F", "fatal"},
	}
	for _, c := range cases {
		t.Run(c.level, func(t *testing.T) {
			line := "11-23 12:34:56.789 1000 2000 " + c.level + " TestTag: " + c.message
			entry := parseLogcatEntry("ABC123", line)
			if entry.Level != c.level {
				t.Errorf("expected level %q, got %q", c.level, entry.Level)
			}
			if entry.Message != c.message {
				t.Errorf("expected message %q, got %q", c.message, entry.Message)
			}
			if entry.Serial != "ABC123" {
				t.Errorf("expected serial 'ABC123', got %q", entry.Serial)
			}
			if entry.Tag != "TestTag" {
				t.Errorf("expected tag 'TestTag', got %q", entry.Tag)
			}
		})
	}
}

func TestParseLogcatEntry_NoMatchKeepsRawMessage(t *testing.T) {
	line := "this is not a logcat-formatted line"
	entry := parseLogcatEntry("ABC123", line)
	if entry.Level != "V" {
		t.Errorf("expected fallback level V for non-matching line, got %q", entry.Level)
	}
	if entry.Message != line {
		t.Errorf("expected raw message preserved, got %q", entry.Message)
	}
	if entry.Tag != "" {
		t.Errorf("expected empty tag for non-matching line, got %q", entry.Tag)
	}
}

func TestParseLogcatEntry_PreservesRawField(t *testing.T) {
	line := "01-02 03:04:05.000 123 456 I TestTag: hello world"
	entry := parseLogcatEntry("ABC123", line)
	if entry.Raw != line {
		t.Errorf("expected raw field to equal input, got %q", entry.Raw)
	}
	if entry.PID != "123" {
		t.Errorf("expected pid '123', got %q", entry.PID)
	}
	if entry.TID != "456" {
		t.Errorf("expected tid '456', got %q", entry.TID)
	}
}