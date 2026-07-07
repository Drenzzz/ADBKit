package packagemgr

import (
	"testing"
)

func TestValidatePackageName(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{"empty", "", "", true},
		{"whitespace only", "   ", "", true},
		{"valid package", "com.android.chrome", "com.android.chrome", false},
		{"with leading spaces", "  com.android.chrome", "com.android.chrome", false},
		{"with trailing spaces", "com.android.chrome  ", "com.android.chrome", false},
		{"system package", "com.android.settings", "com.android.settings", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := validatePackageName(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("validatePackageName(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("validatePackageName(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestParsePackagePathOutput(t *testing.T) {
	t.Run("found", func(t *testing.T) {
		output := "package:/data/app/com.android.chrome/base.apk\n"
		path, err := parsePackagePathOutput(output)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if path != "/data/app/com.android.chrome/base.apk" {
			t.Errorf("expected path '/data/app/com.android.chrome/base.apk', got %q", path)
		}
	})

	t.Run("not found", func(t *testing.T) {
		output := "no such package\n"
		_, err := parsePackagePathOutput(output)
		if err == nil {
			t.Fatal("expected error for missing package path")
		}
	})

	t.Run("multiple lines takes first", func(t *testing.T) {
		output := "package:/data/app/com.android.chrome/base.apk\npackage:/data/app/com.android.chrome/split_config.arm64_v8a.apk\n"
		path, err := parsePackagePathOutput(output)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if path != "/data/app/com.android.chrome/base.apk" {
			t.Errorf("expected first path, got %q", path)
		}
	})
}

func TestParsePackageVersionOutput(t *testing.T) {
	t.Run("both version name and code", func(t *testing.T) {
		output := "    versionName=120.0.6099.144\n    versionCode=609914432\n"
		name, code := parsePackageVersionOutput(output)
		if name != "120.0.6099.144" {
			t.Errorf("expected versionName '120.0.6099.144', got %q", name)
		}
		if code != "609914432" {
			t.Errorf("expected versionCode '609914432', got %q", code)
		}
	})

	t.Run("missing fields", func(t *testing.T) {
		output := "some random output\n"
		name, code := parsePackageVersionOutput(output)
		if name != "" {
			t.Errorf("expected empty versionName, got %q", name)
		}
		if code != "" {
			t.Errorf("expected empty versionCode, got %q", code)
		}
	})
}

func TestParseDataSizeFromDumpsys(t *testing.T) {
	t.Run("dataSize format", func(t *testing.T) {
		output := "    dataSize=12345678\n"
		size := parseDataSizeFromDumpsys(output)
		if size != 12345678 {
			t.Errorf("expected 12345678, got %d", size)
		}
	})

	t.Run("Data Size format", func(t *testing.T) {
		output := "    Data Size: 9876543\n"
		size := parseDataSizeFromDumpsys(output)
		if size != 9876543 {
			t.Errorf("expected 9876543, got %d", size)
		}
	})

	t.Run("not found", func(t *testing.T) {
		output := "some output\n"
		size := parseDataSizeFromDumpsys(output)
		if size != -1 {
			t.Errorf("expected -1, got %d", size)
		}
	})
}

func TestParseByteSizeOutput(t *testing.T) {
	t.Run("valid number", func(t *testing.T) {
		size := parseByteSizeOutput("12345\n")
		if size != 12345 {
			t.Errorf("expected 12345, got %d", size)
		}
	})

	t.Run("not a number", func(t *testing.T) {
		size := parseByteSizeOutput("not a number\n")
		if size != -1 {
			t.Errorf("expected -1, got %d", size)
		}
	})

	t.Run("empty", func(t *testing.T) {
		size := parseByteSizeOutput("")
		if size != -1 {
			t.Errorf("expected -1, got %d", size)
		}
	})
}

func TestParseDUSizeOutput(t *testing.T) {
	t.Run("valid blocks", func(t *testing.T) {
		size := parseDUSizeOutput("1234\n")
		if size != 1234*1024 {
			t.Errorf("expected %d, got %d", 1234*1024, size)
		}
	})

	t.Run("not a number", func(t *testing.T) {
		size := parseDUSizeOutput("not a number\n")
		if size != -1 {
			t.Errorf("expected -1, got %d", size)
		}
	})
}

func TestExtractFirstLine(t *testing.T) {
	t.Run("multi-line returns first non-empty", func(t *testing.T) {
		output := "\n  \nfirst line\nsecond line\n"
		line := extractFirstLine(output)
		if line != "first line" {
			t.Errorf("expected 'first line', got %q", line)
		}
	})

	t.Run("empty returns empty", func(t *testing.T) {
		line := extractFirstLine("")
		if line != "" {
			t.Errorf("expected empty, got %q", line)
		}
	})
}

func TestFallbackMessage(t *testing.T) {
	t.Run("uses first line when available", func(t *testing.T) {
		msg := fallbackMessage("actual error\nmore detail", "fallback")
		if msg != "actual error" {
			t.Errorf("expected 'actual error', got %q", msg)
		}
	})

	t.Run("uses fallback when empty", func(t *testing.T) {
		msg := fallbackMessage("", "fallback msg")
		if msg != "fallback msg" {
			t.Errorf("expected 'fallback msg', got %q", msg)
		}
	})
}

func TestSortPackages(t *testing.T) {
	packages := []Info{
		{PackageName: "com.z.app"},
		{PackageName: "com.a.app"},
		{PackageName: "com.m.app"},
	}
	sorted := sortPackages(packages)
	if sorted[0].PackageName != "com.a.app" {
		t.Errorf("expected first 'com.a.app', got %q", sorted[0].PackageName)
	}
	if sorted[2].PackageName != "com.z.app" {
		t.Errorf("expected last 'com.z.app', got %q", sorted[2].PackageName)
	}
}
