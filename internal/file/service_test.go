package file

import (
	"ADBKit/internal/core"
	"context"
	"errors"
	"testing"
)

func TestService_RequireActiveSerial_NilResolverErrors(t *testing.T) {
	svc := &Service{}
	_, err := svc.requireActiveSerial(context.Background())
	if err == nil {
		t.Fatal("expected error when resolver is nil")
	}
}

func TestService_RequireActiveSerial_PropagatesResolverError(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "", errors.New("offline")
		},
	}
	_, err := svc.requireActiveSerial(context.Background())
	if err == nil {
		t.Fatal("expected error from resolver")
	}
	if err.Error() == "" {
		t.Fatal("expected non-empty error")
	}
}

func TestService_CancelTransfer_NoOpWhenNoActiveTransfer(t *testing.T) {
	svc := &Service{}
	// Should not panic.
	svc.CancelTransfer()
}

func TestValidateRemoteMutationPath_RejectsRestrictedPaths(t *testing.T) {
	restricted := []string{"/system", "/data", "/proc", "/dev"}
	for _, p := range restricted {
		err := validateRemoteMutationPath("delete_file", p)
		if err == nil {
			t.Errorf("expected %q to be rejected", p)
		}
	}
	if err := validateRemoteMutationPath("delete_file", "/sdcard/Download"); err != nil {
		t.Errorf("expected /sdcard/Download to be allowed, got %v", err)
	}
}

func TestService_DeleteFile_RequiresActiveSerial(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "", errors.New("no device")
		},
		getBinPath: func() core.BinaryPaths {
			return core.BinaryPaths{Adb: "/usr/bin/adb"}
		},
	}
	_, err := svc.DeleteFile(context.Background(), "/sdcard/test.txt")
	if err == nil {
		t.Fatal("expected error when no active device")
	}
}

func TestService_CreateDirectory_RejectsRestrictedPath(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "ABC123", nil
		},
		getBinPath: func() core.BinaryPaths {
			return core.BinaryPaths{Adb: "/usr/bin/adb"}
		},
	}
	_, err := svc.CreateDirectory(context.Background(), "/system")
	if err == nil {
		t.Fatal("expected error for restricted path")
	}
}