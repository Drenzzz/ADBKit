package device

import (
	"strings"
	"testing"
)

func TestExtractFirstOutputLine(t *testing.T) {
	cases := []struct {
		name   string
		input  string
		expect string
	}{
		{"empty", "", ""},
		{"single line", "connected to 192.168.1.5:5555", "connected to 192.168.1.5:5555"},
		{"trimmed", "  hello  \nworld", "hello"},
		{"multi line picks first non-empty", "\n\nfirst\nsecond", "first"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := extractFirstOutputLine(c.input)
			if got != c.expect {
				t.Errorf("extractFirstOutputLine(%q) = %q, want %q", c.input, got, c.expect)
			}
		})
	}
}

func TestParseBatteryLevel(t *testing.T) {
	cases := []struct {
		name   string
		input  string
		expect string
	}{
		{"standard dumpsys", "Current Battery Service state:\n  level: 85\n  scale: 100", "85%"},
		{"missing level", "no level here", ""},
		{"empty input", "", ""},
		{"level zero", "level: 0", "0%"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := parseBatteryLevel(c.input)
			if got != c.expect {
				t.Errorf("parseBatteryLevel() = %q, want %q", got, c.expect)
			}
		})
	}
}

func TestParseGetpropOutput(t *testing.T) {
	input := "[ro.product.model]: [Pixel 7]\n[ro.build.version.release]: [13]\n[ro.build.version.sdk]: [33]"
	props := parseGetpropOutput(input)
	if props["ro.product.model"] != "Pixel 7" {
		t.Errorf("expected model 'Pixel 7', got %q", props["ro.product.model"])
	}
	if props["ro.build.version.sdk"] != "33" {
		t.Errorf("expected sdk '33', got %q", props["ro.build.version.sdk"])
	}
}

func TestParseRAMTotal(t *testing.T) {
	t.Run("meminfo total returns formatted size", func(t *testing.T) {
		got := parseRAMTotal("MemTotal:        8000000 kB\nMemFree:         4000000 kB")
		if !strings.Contains(got, "GB") {
			t.Errorf("expected GB unit in output, got %q", got)
		}
	})
	t.Run("missing returns empty", func(t *testing.T) {
		if got := parseRAMTotal("no meminfo here"); got != "" {
			t.Errorf("expected empty string for missing meminfo, got %q", got)
		}
	})
}

func TestParseStorageInfo_ReturnsFormattedString(t *testing.T) {
	input := "Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/block/sda  1000000  500000  500000  50% /data"
	got := parseStorageInfo(input)
	if got == "" {
		t.Fatal("expected non-empty result for valid df output")
	}
	if !strings.Contains(got, "1000000") {
		t.Errorf("expected storage result to include total size, got %q", got)
	}
}

func TestParseStorageInfo_ReturnsEmptyOnInvalid(t *testing.T) {
	if got := parseStorageInfo("garbage output"); got != "" {
		t.Errorf("expected empty string for invalid input, got %q", got)
	}
}