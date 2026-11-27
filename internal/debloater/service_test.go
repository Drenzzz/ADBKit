package debloater

import (
	"ADBKit/internal/device"
	packagemgr "ADBKit/internal/package_mgr"
	"context"
	"errors"
	"testing"
)

type fakePkgOps struct {
	installed     []packagemgr.Info
	uninstalled   []string
	debloated     []string
	disabled      []string
	restored      []string
	failOnPkg     string
	keepDataCalls []bool
}

func (f *fakePkgOps) ListPackages(_ context.Context, _ string) ([]packagemgr.Info, error) {
	return f.installed, nil
}

func (f *fakePkgOps) ListUninstalledPackages(_ context.Context) ([]string, error) {
	return f.uninstalled, nil
}

func (f *fakePkgOps) UninstallPackageForUser0(_ context.Context, pkg string, keepData bool) (string, error) {
	if pkg == f.failOnPkg {
		return "", errors.New("Failure [not installed for 0]")
	}
	f.debloated = append(f.debloated, pkg)
	f.keepDataCalls = append(f.keepDataCalls, keepData)
	return "Success", nil
}

func (f *fakePkgOps) DisablePackage(_ context.Context, pkg string) (string, error) {
	if pkg == f.failOnPkg {
		return "", errors.New("cannot disable")
	}
	f.disabled = append(f.disabled, pkg)
	return "Disabled", nil
}

func (f *fakePkgOps) RestorePackage(_ context.Context, pkg string) (string, error) {
	if pkg == f.failOnPkg {
		return "", errors.New("not found")
	}
	f.restored = append(f.restored, pkg)
	return "Restored", nil
}

type fakeDeviceLookup struct{}

func (fakeDeviceLookup) GetDeviceInfo(_ context.Context, serial string) (*device.Info, error) {
	return &device.Info{
		Serial:       serial,
		Brand:        "Xiaomi",
		Manufacturer: "Xiaomi",
		Model:        "2312DRA50G",
	}, nil
}

func newTestService(t *testing.T, ops *fakePkgOps) *Service {
	t.Helper()
	svc, err := NewService(t.TempDir(), ops, fakeDeviceLookup{}, func(context.Context) (string, error) {
		return "TESTSERIAL", nil
	})
	if err != nil {
		t.Fatalf("NewService: %v", err)
	}
	return svc
}

func TestScan_OnlyInstalledNonCriticalPackages(t *testing.T) {
	ops := &fakePkgOps{
		installed: []packagemgr.Info{
			{PackageName: "com.miui.msa.global", IsEnabled: true, IsSystemApp: true},
			{PackageName: "com.booking", IsEnabled: true, IsSystemApp: false},
			{PackageName: "com.xiaomi.joyose", IsEnabled: true, IsSystemApp: true},
			{PackageName: "com.xiaomi.finddevice", IsEnabled: true, IsSystemApp: true},
		},
	}
	svc := newTestService(t, ops)

	res, err := svc.Scan(context.Background())
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	if res.Counts.Total != 3 {
		t.Fatalf("expected 3 installed non-critical items, got %d", res.Counts.Total)
	}
	if res.Counts.Safe != 2 || res.Counts.Caution != 1 {
		t.Fatalf("unexpected risk counts: %+v", res.Counts)
	}
	if res.Counts.System != 2 || res.Counts.User != 1 {
		t.Fatalf("unexpected type counts: %+v", res.Counts)
	}
	for _, item := range res.Items {
		if item.PackageName == "com.xiaomi.finddevice" {
			t.Fatal("critical package must never appear in Scan items")
		}
	}
	if len(res.Presets) < 2 {
		t.Fatalf("expected presets to be generated for installed safe packages, got %d", len(res.Presets))
	}
}

func TestDebloat_HardBlocksCriticalAndAggregatesFailures(t *testing.T) {
	ops := &fakePkgOps{
		failOnPkg: "com.miui.analytics",
	}
	svc := newTestService(t, ops)

	res, err := svc.Debloat(context.Background(), []string{
		"com.xiaomi.finddevice",
		"com.miui.msa.global",
		"com.miui.analytics",
	}, true)
	if err != nil {
		t.Fatalf("mixed batch should return summary without top-level error, got %v", err)
	}
	if res.Skipped != 1 || res.Succeeded != 1 || res.Failed != 1 {
		t.Fatalf("unexpected batch result: %+v", res)
	}
	if len(ops.debloated) != 1 || ops.debloated[0] != "com.miui.msa.global" {
		t.Fatalf("unexpected debloated list: %v", ops.debloated)
	}

	// All-critical batch must return an explicit error.
	_, err = svc.Debloat(context.Background(), []string{"com.xiaomi.finddevice", "com.miui.home"}, true)
	if err == nil {
		t.Fatal("expected error when all requested packages are critical")
	}
}

func TestListRestorable_EnrichesCatalogEntries(t *testing.T) {
	ops := &fakePkgOps{
		uninstalled: []string{"com.unknown.oem", "com.miui.msa.global", "com.xiaomi.finddevice"},
	}
	svc := newTestService(t, ops)

	items, err := svc.ListRestorable(context.Background())
	if err != nil {
		t.Fatalf("ListRestorable failed: %v", err)
	}
	if len(items) != 3 {
		t.Fatalf("expected 3 items, got %d", len(items))
	}
	if !items[0].InCatalog || items[0].PackageName != "com.miui.msa.global" {
		t.Fatalf("expected catalog-known item sorted first, got %+v", items[0])
	}
	if items[1].InCatalog {
		t.Fatalf("expected unknown package InCatalog=false, got %+v", items[1])
	}
}
