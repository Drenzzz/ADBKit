package app

import (
	"ADBKit/internal/core"
	"testing"
)

func TestParseAdbMajorVersion(t *testing.T) {
	cases := []struct {
		name    string
		version string
		want    int
		ok      bool
	}{
		{"platform-tools-30", "Android Debug Bridge version 1.0.39 (Version 30.0.0-6438266)", 30, true},
		{"platform-tools-35", "Android Debug Bridge version 1.0.41 (Version 35.0.1-12147458)", 35, true},
		{"major-minor-only", "Android Debug Bridge version 1.0.41", 1, true},
		{"no-version", "unknown binary", 0, false},
		{"empty", "", 0, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, ok := parseAdbMajorVersion(c.version)
			if ok != c.ok || got != c.want {
				t.Fatalf("parseAdbMajorVersion(%q) = (%d, %v), want (%d, %v)", c.version, got, ok, c.want, c.ok)
			}
		})
	}
}

func TestWirelessPairingSupported(t *testing.T) {
	ready := core.BinaryInfo{
		Name:   "adb",
		Path:   "/usr/bin/adb",
		Source: "system-path",
		Status: core.BinaryReady,
	}
	missing := core.BinaryInfo{
		Name:   "adb",
		Status: core.BinaryMissing,
	}

	if wirelessPairingSupported(nil) {
		t.Fatal("expected false for nil info")
	}
	if wirelessPairingSupported(&missing) {
		t.Fatal("expected false for missing status")
	}

	modern := ready
	modern.Version = "Android Debug Bridge version 1.0.41 (Version 35.0.1-12147458)"
	if !wirelessPairingSupported(&modern) {
		t.Fatal("expected true for platform-tools 35")
	}

	old := ready
	old.Version = "Android Debug Bridge version 1.0.36 (Version 29.0.6-6198805)"
	if wirelessPairingSupported(&old) {
		t.Fatal("expected false for platform-tools 29")
	}

	unknown := ready
	unknown.Version = ""
	if !wirelessPairingSupported(&unknown) {
		t.Fatal("expected true for unparseable version (modern-assumed)")
	}
}