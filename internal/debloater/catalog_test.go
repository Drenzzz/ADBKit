package debloater

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadCatalog_BuiltinIntegrity(t *testing.T) {
	cat, err := LoadCatalog(t.TempDir())
	if err != nil {
		t.Fatalf("LoadCatalog failed: %v", err)
	}

	meta := cat.Meta()
	if meta.BuiltinCount < 100 {
		t.Fatalf("expected at least 100 builtin entries, got %d", meta.BuiltinCount)
	}
	if meta.CriticalCount < 19 {
		t.Fatalf("expected at least 19 critical entries, got %d", meta.CriticalCount)
	}
	if !cat.IsProtected("com.xiaomi.finddevice") {
		t.Fatal("expected com.xiaomi.finddevice to be protected")
	}
	if !cat.IsProtected("com.xiaomi.bluetooth") {
		t.Fatal("expected com.xiaomi.bluetooth to be protected")
	}
	if cat.IsProtected("com.miui.msa.global") {
		t.Fatal("com.miui.msa.global should not be protected")
	}
}

func TestCatalog_CustomCannotDowngradeBuiltinCritical(t *testing.T) {
	dir := t.TempDir()
	cat, err := LoadCatalog(dir)
	if err != nil {
		t.Fatalf("LoadCatalog failed: %v", err)
	}

	customFile := filepath.Join(dir, "custom.json")
	payload := `{
		"version": "custom-1",
		"packages": [
			{
				"packageName": "com.xiaomi.finddevice",
				"appName": "Sneaky Override",
				"risk": "safe"
			},
			{
				"packageName": "com.example.custombloat",
				"appName": "Custom Bloat",
				"vendor": "third-party",
				"category": "Partner Preloads",
				"risk": "safe",
				"description": "Custom entry"
			}
		]
	}`
	if err := os.WriteFile(customFile, []byte(payload), 0o600); err != nil {
		t.Fatalf("write custom file: %v", err)
	}

	meta, err := cat.ImportCustomCatalog(customFile)
	if err != nil {
		t.Fatalf("ImportCustomCatalog failed: %v", err)
	}
	if meta.CustomCount != 2 {
		t.Fatalf("expected CustomCount=2, got %d", meta.CustomCount)
	}
	if !cat.IsProtected("com.xiaomi.finddevice") {
		t.Fatal("critical builtin package must remain protected even after custom import")
	}

	for _, entry := range cat.MergedEntries() {
		if entry.PackageName == "com.xiaomi.finddevice" && entry.Risk != RiskCritical {
			t.Fatalf("com.xiaomi.finddevice risk was downgraded to %s", entry.Risk)
		}
	}

	foundCustom := false
	for _, entry := range cat.MergedEntries() {
		if entry.PackageName == "com.example.custombloat" {
			foundCustom = true
			if entry.Source != "custom" {
				t.Fatalf("expected custom source, got %q", entry.Source)
			}
		}
	}
	if !foundCustom {
		t.Fatal("expected custom package to appear in merged entries")
	}
}

func TestCatalog_RejectsInvalidPackageNameInCustomJSON(t *testing.T) {
	dir := t.TempDir()
	cat, err := LoadCatalog(dir)
	if err != nil {
		t.Fatalf("LoadCatalog failed: %v", err)
	}

	customFile := filepath.Join(dir, "bad.json")
	if err := os.WriteFile(customFile, []byte(`[{"packageName": "com.bad;rm -rf /", "risk": "safe"}]`), 0o600); err != nil {
		t.Fatal(err)
	}

	if _, err := cat.ImportCustomCatalog(customFile); err == nil {
		t.Fatal("expected invalid packageName to fail import")
	}
}
