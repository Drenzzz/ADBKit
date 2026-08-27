package packagemgr

import (
	"ADBKit/internal/core"
	"context"
	"errors"
	"strings"
	"testing"
)

func TestUninstallPackage_ValidatesName(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "ABC123", nil
		},
		getBinPath: func() core.BinaryPaths {
			return core.BinaryPaths{Adb: "/usr/bin/adb"}
		},
	}

	if _, err := svc.UninstallPackage(context.Background(), ""); err == nil {
		t.Fatal("expected empty name to error")
	}
	if _, err := svc.UninstallPackage(context.Background(), "  "); err == nil {
		t.Fatal("expected whitespace name to error")
	}
}

func TestUninstallPackage_RequiresSerial(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "", errors.New("no device")
		},
		getBinPath: func() core.BinaryPaths {
			return core.BinaryPaths{Adb: "/usr/bin/adb"}
		},
	}

	if _, err := svc.UninstallPackage(context.Background(), "com.example.app"); err == nil {
		t.Fatal("expected error when no active device")
	}
}

func TestRunBatchOperation_EmptyListReturnsError(t *testing.T) {
	svc := &Service{}
	if _, err := svc.runBatchOperation(context.Background(), "uninstall_packages", []string{"", "  "}, svc.UninstallPackage, "uninstalled"); err == nil {
		t.Fatal("expected empty batch to error")
	}
}

func TestDisableEnablePackage_RequiresActiveSerial(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "", errors.New("no device")
		},
		getBinPath: func() core.BinaryPaths {
			return core.BinaryPaths{Adb: "/usr/bin/adb"}
		},
	}

	if _, err := svc.DisablePackage(context.Background(), "com.example.app"); err == nil {
		t.Fatal("expected error when no device (disable)")
	}
	if _, err := svc.EnablePackage(context.Background(), "com.example.app"); err == nil {
		t.Fatal("expected error when no device (enable)")
	}
}

func TestRunBatchOperation_PropagatesOperationErrors(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) {
			return "", errors.New("no device")
		},
		getBinPath: func() core.BinaryPaths {
			return core.BinaryPaths{Adb: "/usr/bin/adb"}
		},
	}
	msg, err := svc.DisableMultiplePackages(context.Background(), []string{"com.a", "com.b"})
	if err != nil {
		t.Fatalf("batch itself should not error (it aggregates), got %v", err)
	}
	if !strings.Contains(msg, "Failed: 2") {
		t.Fatalf("expected message to report 2 failures, got %q", msg)
	}
	if !strings.Contains(msg, "no device") {
		t.Fatalf("expected underlying error detail in message, got %q", msg)
	}
}