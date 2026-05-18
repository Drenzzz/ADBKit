package main

import (
	"context"
	"testing"
)

func TestParsePackageListOutputEnabledUserPackages(t *testing.T) {
	output := "package:com.android.chrome\npackage:com.google.android.youtube\npackage:com.android.chrome\n"

	packages := parsePackageListOutput(output, true, false)
	if len(packages) != 2 {
		t.Fatalf("expected 2 packages, got %d", len(packages))
	}

	if packages[0].PackageName != "com.android.chrome" {
		t.Fatalf("expected first package to be com.android.chrome, got %s", packages[0].PackageName)
	}

	if !packages[0].IsEnabled {
		t.Fatal("expected first package to be enabled")
	}

	if packages[0].IsSystemApp {
		t.Fatal("expected first package to be user app")
	}
}

func TestParsePackageListOutputDisabledSystemPackages(t *testing.T) {
	output := "package:com.android.wallpaper\npackage:com.android.printspooler\n"

	packages := parsePackageListOutput(output, false, true)
	if len(packages) != 2 {
		t.Fatalf("expected 2 packages, got %d", len(packages))
	}

	if packages[1].PackageName != "com.android.printspooler" {
		t.Fatalf("expected second package to be com.android.printspooler, got %s", packages[1].PackageName)
	}

	if packages[1].IsEnabled {
		t.Fatal("expected second package to be disabled")
	}

	if !packages[1].IsSystemApp {
		t.Fatal("expected second package to be system app")
	}
}

func TestParsePackageListOutputEmpty(t *testing.T) {
	packages := parsePackageListOutput("", true, false)
	if len(packages) != 0 {
		t.Fatalf("expected 0 packages, got %d", len(packages))
	}
}

func TestParsePackagePathOutput(t *testing.T) {
	output := "package:/data/app/~~abc/base.apk\n"

	path, err := parsePackagePathOutput(output)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if path != "/data/app/~~abc/base.apk" {
		t.Fatalf("expected parsed path, got %s", path)
	}
}

func TestParsePackagePathOutputMissingPath(t *testing.T) {
	_, err := parsePackagePathOutput("warning: package not found\n")
	if err == nil {
		t.Fatal("expected error when package path is missing")
	}
}

func TestParsePackageVersionOutput(t *testing.T) {
	output := "Packages:\n  Package [com.example.app] (12345):\n    versionCode=412 minSdk=24 targetSdk=34\n    versionName=2.7.1\n"

	versionName, versionCode := parsePackageVersionOutput(output)
	if versionName != "2.7.1" {
		t.Fatalf("expected version name 2.7.1, got %s", versionName)
	}
	if versionCode != "412" {
		t.Fatalf("expected version code 412, got %s", versionCode)
	}
}

func TestParseByteSizeOutput(t *testing.T) {
	size := parseByteSizeOutput("123456\n")
	if size != 123456 {
		t.Fatalf("expected size 123456, got %d", size)
	}
}

func TestParseByteSizeOutputEmpty(t *testing.T) {
	size := parseByteSizeOutput("")
	if size != -1 {
		t.Fatalf("expected -1 for empty, got %d", size)
	}
}

func TestParseDUSizeOutput(t *testing.T) {
	size := parseDUSizeOutput("2048\t/data/data/com.example.app\n")
	if size != 2097152 {
		t.Fatalf("expected size 2097152, got %d", size)
	}
}

func TestNormalizePackageFilter(t *testing.T) {
	tests := []struct {
		input string
		want  PackageFilter
		err   bool
	}{
		{"user", packageFilterUser, false},
		{"system", packageFilterSystem, false},
		{"all", packageFilterAll, false},
		{"", packageFilterAll, false},
		{"invalid", "", true},
	}
	for _, tt := range tests {
		got, err := normalizePackageFilter(tt.input)
		if (err != nil) != tt.err {
			t.Errorf("normalizePackageFilter(%q) error = %v, wantErr %v", tt.input, err, tt.err)
			continue
		}
		if got != tt.want {
			t.Errorf("normalizePackageFilter(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestValidatePackageName(t *testing.T) {
	_, err := validatePackageName("")
	if err == nil {
		t.Fatal("expected error for empty package name")
	}

	_, err = validatePackageName("  ")
	if err == nil {
		t.Fatal("expected error for whitespace-only package name")
	}

	name, err := validatePackageName("com.example.app")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if name != "com.example.app" {
		t.Fatalf("expected com.example.app, got %s", name)
	}
}

func TestMapValues(t *testing.T) {
	input := map[string]int{"a": 1, "b": 2}
	values := mapValues(input)
	if len(values) != 2 {
		t.Fatalf("expected 2 values, got %d", len(values))
	}
}

func TestExtractFirstLine(t *testing.T) {
	if got := extractFirstLine("hello\nworld\n"); got != "hello" {
		t.Errorf("expected hello, got %s", got)
	}
	if got := extractFirstLine(""); got != "" {
		t.Errorf("expected empty, got %s", got)
	}
	if got := extractFirstLine("\n\n  test\n"); got != "test" {
		t.Errorf("expected test, got %s", got)
	}
}

func TestFallbackMessage(t *testing.T) {
	if got := fallbackMessage("output line", "fallback"); got != "output line" {
		t.Errorf("expected output line, got %s", got)
	}
	if got := fallbackMessage("", "fallback"); got != "fallback" {
		t.Errorf("expected fallback, got %s", got)
	}
}

func TestPackageFilterFlag(t *testing.T) {
	if got := packageFilterFlag(packageFilterUser); got != "-3" {
		t.Errorf("expected -3, got %s", got)
	}
	if got := packageFilterFlag(packageFilterSystem); got != "-s" {
		t.Errorf("expected -s, got %s", got)
	}
	if got := packageFilterFlag(packageFilterAll); got != "" {
		t.Errorf("expected empty, got %s", got)
	}
}

func TestPackageService_ListPackagesRequiresSerial(t *testing.T) {
	s := NewPackageService(nil, nil)
	_, err := s.ListPackages(context.Background(), "user")
	if err == nil {
		t.Fatal("expected error when resolver is nil")
	}
}

func TestPackageService_InstallRequiresPath(t *testing.T) {
	s := NewPackageService(nil, nil)
	_, err := s.InstallPackage(context.Background(), "")
	if err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestPackageService_UninstallRequiresName(t *testing.T) {
	s := NewPackageService(nil, nil)
	_, err := s.UninstallPackage(context.Background(), "")
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestPackageService_PullRequiresSaveFileCallback(t *testing.T) {
	s := NewPackageService(
		func(ctx context.Context) (string, error) { return "SER123", nil },
		nil,
	)
	_, err := s.PullPackageApk(context.Background(), "com.example.app")
	if err == nil {
		t.Fatal("expected error when save file callback is nil")
	}
}

func TestPackageService_BatchRequiresSelection(t *testing.T) {
	s := NewPackageService(nil, nil)
	_, err := s.UninstallMultiplePackages(context.Background(), []string{})
	if err == nil {
		t.Fatal("expected error for empty batch")
	}
}

func TestPackageService_BatchFiltersEmptyNames(t *testing.T) {
	s := NewPackageService(nil, nil)
	_, err := s.UninstallMultiplePackages(context.Background(), []string{"", "  "})
	if err == nil {
		t.Fatal("expected error when all names are empty after trim")
	}
}
