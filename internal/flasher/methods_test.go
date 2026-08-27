package flasher

import (
	"ADBKit/internal/core"
	"context"
	"errors"
	"os"
	"strings"
	"testing"
)

// fakeAdbPath returns a path that re-execs the test binary. The test binary
// detects "fastboot-fake-X-Y" args and emits deterministic output.
func fakeAdbPath(t *testing.T) string {
	t.Helper()
	return os.Args[0]
}

// runWithFakeBinary invokes `fn` after re-pointing ResolveFastbootPath to a
// self-ref binary. The callback receives the active serial string to use.
func runWithFakeBinary(t *testing.T, fn func(binPath string) error) error {
	t.Helper()
	binPath := fakeAdbPath(t)
	return fn(binPath)
}

func TestFastbootService_FlashPartition_RejectsInvalidPartition(t *testing.T) {
	if err := core.ValidateFlashPartition("cache"); err == nil {
		t.Fatal("expected cache to be rejected (not in allowlist)")
	}
	if err := core.ValidateFlashPartition("BOOT"); err != nil {
		t.Fatalf("expected uppercase BOOT to be normalised and accepted, got %v", err)
	}
	if err := core.ValidateFlashPartition("  boot  "); err != nil {
		t.Fatalf("expected trimmed boot to be accepted, got %v", err)
	}
	if err := core.ValidateFlashPartition(""); err == nil {
		t.Fatal("expected empty partition to be rejected")
	}
}

func TestFastbootService_FlashPartition_RejectsInvalidExtension(t *testing.T) {
	if err := core.ValidateFlashFile("/tmp/boot.txt"); err == nil {
		t.Fatal("expected .txt to be rejected for flash")
	}
	if err := core.ValidateFlashFile("/tmp/boot.img"); err == nil {
		t.Fatal("expected missing file to error")
	}
	tmp, err := os.CreateTemp("", "boot-*.img")
	if err != nil {
		t.Fatal(err)
	}
	tmp.Close()
	defer os.Remove(tmp.Name())
	if err := core.ValidateFlashFile(tmp.Name()); err != nil {
		t.Fatalf("expected valid .img to pass, got %v", err)
	}
}

func TestFastbootService_RunCustomCommand_BlocksShellOperators(t *testing.T) {
	if _, err := normalizeFastbootArgs("flash boot & rm -rf /"); err == nil {
		t.Fatal("expected ampersand to be blocked")
	}
	if _, err := normalizeFastbootArgs("flash boot; cat /etc/passwd"); err == nil {
		t.Fatal("expected semicolon to be blocked")
	}
}

func TestFastbootService_SetActiveSlot_RejectsInvalidSlot(t *testing.T) {
	svc := &FastbootService{
		binaryService: nil,
		getConfig: func() *core.AppConfig {
			return &core.AppConfig{
				FastbootPath: os.Args[0],
			}
		},
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "ABC123", nil
		},
	}

	_, err := svc.SetActiveSlot(context.Background(), "ABC123", "c")
	if err == nil {
		t.Fatal("expected invalid slot to error")
	}
	if !strings.Contains(err.Error(), "set_active_slot") {
		t.Fatalf("expected operation tag in error, got %v", err)
	}
}

func TestFastbootService_RequireSerial_RejectsEmptyResolver(t *testing.T) {
	svc := &FastbootService{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "", nil
		},
	}
	_, err := svc.requireSerial(context.Background(), "")
	if err == nil {
		t.Fatal("expected empty resolved serial to error")
	}
	if !strings.Contains(err.Error(), "no active device available") {
		t.Fatalf("expected friendly error, got %v", err)
	}
}

func TestFastbootService_RequireSerial_PropagatesResolverError(t *testing.T) {
	svc := &FastbootService{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "", errors.New("offline")
		},
	}
	_, err := svc.requireSerial(context.Background(), "")
	if err == nil {
		t.Fatal("expected error from resolver")
	}
	if !strings.Contains(err.Error(), "offline") {
		t.Fatalf("expected underlying error in message, got %v", err)
	}
}
