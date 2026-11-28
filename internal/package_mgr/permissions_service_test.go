package packagemgr

import (
	"ADBKit/internal/core"
	"context"
	"errors"
	"testing"
)

func TestSetPackagePermission_Validation(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) { return "ABC", nil },
		getBinPath: func() core.BinaryPaths { return core.BinaryPaths{Adb: "/usr/bin/adb"} },
	}
	if _, err := svc.SetPackagePermission(context.Background(), "", "android.permission.CAMERA", true); err == nil {
		t.Fatal("expected empty pkg error")
	}
	if _, err := svc.SetPackagePermission(context.Background(), "com.example", "", true); err == nil {
		t.Fatal("expected empty perm error")
	}
	if _, err := svc.SetPackagePermission(context.Background(), "com.example", "bad;rm", true); err == nil {
		t.Fatal("expected invalid perm error")
	}
}

func TestSetPackageAppOp_Validation(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) { return "ABC", nil },
		getBinPath: func() core.BinaryPaths { return core.BinaryPaths{Adb: "/usr/bin/adb"} },
	}
	if _, err := svc.SetPackageAppOp(context.Background(), "com.example", "CAMERA", "evil"); err == nil {
		t.Fatal("expected invalid mode")
	}
	if _, err := svc.SetPackageAppOp(context.Background(), "com.example", "bad;op", "allow"); err == nil {
		t.Fatal("expected invalid op")
	}
	if _, err := svc.SetPackageAppOp(context.Background(), "", "CAMERA", "allow"); err == nil {
		t.Fatal("expected empty pkg")
	}
}

func TestGetPackagePermissions_RequiresSerial(t *testing.T) {
	svc := &Service{
		resolveActiveSerial: func(ctx context.Context) (string, error) { return "", errors.New("no device") },
		getBinPath: func() core.BinaryPaths { return core.BinaryPaths{Adb: "/usr/bin/adb"} },
	}
	if _, err := svc.GetPackagePermissions(context.Background(), "com.example.app"); err == nil {
		t.Fatal("expected error when no device")
	}
}
