package download

import (
	"runtime"
	"testing"
)

// Guard against a repeat of the 37.0.1-win.zip incident where the pin was
// removed instead of updated, silently disabling integrity verification for
// every managed download.
func TestPinnedChecksumsPresent(t *testing.T) {
	if downloadManifest.PlatformToolsVersion == "" {
		t.Fatal("platform_tools_version is empty")
	}
	if downloadManifest.ScrcpyVersion == "" {
		t.Fatal("scrcpy_version is empty")
	}

	platformToolsPins := map[string]string{
		"linux":   downloadManifest.PlatformToolsSHA256["linux"],
		"darwin":  downloadManifest.PlatformToolsSHA256["darwin"],
		"windows": downloadManifest.PlatformToolsSHA256["windows"],
	}
	for goos, pin := range platformToolsPins {
		if len(pin) != 64 {
			t.Errorf("platform-tools pin for %s must be a full sha256, got %q (len %d)", goos, pin, len(pin))
		}
	}

	scrcpyPins := map[string]string{
		"linux/amd64":   downloadManifest.ScrcpySHA256["linux/amd64"],
		"darwin/amd64":  downloadManifest.ScrcpySHA256["darwin/amd64"],
		"windows/amd64": downloadManifest.ScrcpySHA256["windows/amd64"],
		"windows/arm64": downloadManifest.ScrcpySHA256["windows/arm64"],
	}
	for platform, pin := range scrcpyPins {
		if len(pin) != 64 {
			t.Errorf("scrcpy pin for %s must be a full sha256, got %q (len %d)", platform, pin, len(pin))
		}
	}

	// darwin/arm64 is deliberately unpinned: no tester has verified the
	// macOS arm64 package, so it must fail fast instead of downloading.
	if pin, ok := downloadManifest.ScrcpySHA256["darwin/arm64"]; ok {
		t.Errorf("darwin/arm64 must stay unpinned until verified, found %q", pin)
	}
}

func TestPinnedChecksumsCoverHostPlatform(t *testing.T) {
	goos := runtime.GOOS
	if goos != "linux" && goos != "darwin" && goos != "windows" {
		t.Skipf("unsupported host OS: %s", goos)
	}
	if goos == "darwin" && runtime.GOARCH == "arm64" {
		t.Skip("darwin/arm64 is intentionally unsupported until a tester verifies it")
	}
	if got := downloadManifest.PlatformToolsSHA256[goos]; len(got) != 64 {
		t.Errorf("platform-tools pin missing for host OS %s", goos)
	}
	if got := downloadManifest.ScrcpySHA256[goos+"/"+runtime.GOARCH]; len(got) != 64 {
		t.Errorf("scrcpy pin missing for host platform %s/%s", goos, runtime.GOARCH)
	}
}

func TestResolvePlatformToolsArchive(t *testing.T) {
	archive, pin, err := resolvePlatformToolsArchive("linux")
	if err != nil {
		t.Fatalf("linux should be supported: %v", err)
	}
	if archive != "platform-tools_r"+downloadManifest.PlatformToolsVersion+"-linux.zip" {
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

func TestResolveScrcpyArchive_ArchMatrix(t *testing.T) {
	version := downloadManifest.ScrcpyVersion

	cases := []struct {
		name    string
		goos    string
		goarch  string
		want    string
		wantErr bool
	}{
		{name: "linux amd64", goos: "linux", goarch: "amd64", want: "scrcpy-linux-x86_64-v" + version + ".tar.gz"},
		{name: "linux arm64", goos: "linux", goarch: "arm64", wantErr: true},
		{name: "darwin amd64", goos: "darwin", goarch: "amd64", want: "scrcpy-macos-x86_64-v" + version + ".tar.gz"},
		{name: "darwin arm64", goos: "darwin", goarch: "arm64", wantErr: true},
		{name: "windows amd64", goos: "windows", goarch: "amd64", want: "scrcpy-win64-v" + version + ".zip"},
		{name: "windows arm64", goos: "windows", goarch: "arm64", want: "scrcpy-winarm64-v" + version + ".zip"},
		{name: "windows 386", goos: "windows", goarch: "386", wantErr: true},
		{name: "unsupported os", goos: "plan9", goarch: "amd64", wantErr: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			archive, pin, err := resolveScrcpyArchive(tc.goos, tc.goarch)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error, got archive %q", archive)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if archive != tc.want {
				t.Errorf("archive = %q, want %q", archive, tc.want)
			}
			if len(pin) != 64 {
				t.Errorf("pin must be a full sha256, got %q", pin)
			}
		})
	}
}
