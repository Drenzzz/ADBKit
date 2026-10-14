package download

import (
	"runtime"
	"testing"
)

// Guard against a repeat of the 37.0.1-win.zip incident where the pin was
// removed instead of updated, silently disabling integrity verification for
// every managed download.
func TestPinnedChecksumsPresent(t *testing.T) {
	if platformToolsVersion == "" {
		t.Fatal("platformToolsVersion is empty")
	}
	if scrcpyVersion == "" {
		t.Fatal("scrcpyVersion is empty")
	}

	platformToolsPins := map[string]string{
		"linux":   platformToolsLinuxSHA256,
		"darwin":  platformToolsDarwinSHA256,
		"windows": platformToolsWindowsSHA256,
	}
	for goos, pin := range platformToolsPins {
		if len(pin) != 64 {
			t.Errorf("platform-tools pin for %s must be a full sha256, got %q (len %d)", goos, pin, len(pin))
		}
	}

	scrcpyPins := map[string]string{
		"linux":   scrcpyLinuxSHA256,
		"darwin":  scrcpyDarwinSHA256,
		"windows": scrcpyWindowsSHA256,
	}
	for goos, pin := range scrcpyPins {
		if len(pin) != 64 {
			t.Errorf("scrcpy pin for %s must be a full sha256, got %q (len %d)", goos, pin, len(pin))
		}
	}
}

func TestResolvePlatformToolsArchive(t *testing.T) {
	archive, pin, err := resolvePlatformToolsArchive("linux")
	if err != nil {
		t.Fatalf("linux should be supported: %v", err)
	}
	if archive != "platform-tools_r"+platformToolsVersion+"-linux.zip" {
		t.Errorf("unexpected linux archive name: %q", archive)
	}
	if len(pin) != 64 {
		t.Errorf("linux pin must be a full sha256, got %q", pin)
	}

	archive, pin, err = resolvePlatformToolsArchive(runtime.GOOS)
	if runtime.GOOS == "linux" || runtime.GOOS == "darwin" || runtime.GOOS == "windows" {
		if err != nil {
			t.Fatalf("host OS should be supported: %v", err)
		}
		if len(pin) != 64 {
			t.Errorf("host OS pin must be a full sha256, got %q", pin)
		}
	}
}

func TestResolvePlatformToolsArchive_UnsupportedOS(t *testing.T) {
	_, _, err := resolvePlatformToolsArchive("plan9")
	if err == nil {
		t.Fatal("expected error for unsupported OS")
	}
}

func TestResolveScrcpyArchive(t *testing.T) {
	archive, pin, err := resolveScrcpyArchive("linux", "amd64")
	if err != nil {
		t.Fatalf("linux/amd64 should be supported: %v", err)
	}
	if archive != "scrcpy-linux-x86_64-v"+scrcpyVersion+".tar.gz" {
		t.Errorf("unexpected linux archive name: %q", archive)
	}
	if len(pin) != 64 {
		t.Errorf("linux pin must be a full sha256, got %q", pin)
	}

	if _, _, err := resolveScrcpyArchive("linux", "arm64"); err == nil {
		t.Fatal("expected error for linux/arm64: upstream ships no linux-aarch64 asset")
	}
}

func TestResolveScrcpyArchive_UnsupportedOS(t *testing.T) {
	_, _, err := resolveScrcpyArchive("plan9", "amd64")
	if err == nil {
		t.Fatal("expected error for unsupported OS")
	}
}
