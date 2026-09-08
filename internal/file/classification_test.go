package file

import (
	"testing"
)

func TestClassifyPath(t *testing.T) {
	tests := []struct {
		name string
		path string
		want PathClass
	}{
		{"root is system", "/", PathSystem},
		{"empty normalizes to sdcard public", "", PathPublic},
		{"sdcard public", "/sdcard", PathPublic},
		{"sdcard download public", "/sdcard/Download", PathPublic},
		{"scoped android/data protected", "/sdcard/Android/data", PathProtected},
		{"scoped android/data subpath protected", "/sdcard/Android/data/com.example", PathProtected},
		{"scoped android/obb protected", "/sdcard/Android/obb", PathProtected},
		{"emulated scoped protected", "/storage/emulated/0/Android/data", PathProtected},
		{"emulated scoped obb protected", "/storage/emulated/0/Android/obb", PathProtected},
		{"emulated dcim public", "/storage/emulated/0/DCIM", PathPublic},
		{"external sd root public", "/storage/1234-5678", PathPublic},
		{"external sd subpath public", "/storage/1234-5678/DCIM", PathPublic},
		{"system path", "/system", PathSystem},
		{"system subpath", "/system/bin", PathSystem},
		{"data path", "/data", PathSystem},
		{"vendor path", "/vendor/foo", PathSystem},
		{"proc path", "/proc/cpuinfo", PathSystem},
		{"cache path", "/cache/recovery", PathSystem},
		{"mnt path", "/mnt/sdcard", PathSystem},
		{"boot path", "/boot", PathSystem},
		{"metadata path", "/metadata", PathSystem},
		{"trailing slash cleaned", "/system/", PathSystem},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ClassifyPath(tt.path); got != tt.want {
				t.Errorf("ClassifyPath(%q) = %v, want %v", tt.path, got, tt.want)
			}
		})
	}
}

func TestIsSdCardMountPoint(t *testing.T) {
	tests := []struct {
		name string
		path string
		want bool
	}{
		{"internal sd not external", "/storage/emulated/0", false},
		{"internal sd subpath not external", "/storage/emulated/0/DCIM", false},
		{"uuid external", "/storage/1234-5678", true},
		{"uuid external subpath", "/storage/1234-5678/Pictures", true},
		{"media rw uuid external", "/mnt/media_rw/ABCD-EFGH", true},
		{"media rw uuid subpath", "/mnt/media_rw/ABCD-EFGH/Music", true},
		{"hex vendor external", "/storage/aabbccddeeff0011", true},
		{"sdcard root not external", "/sdcard", false},
		{"system not external", "/system", false},
		{"empty not external", "", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsSdCardMountPoint(tt.path); got != tt.want {
				t.Errorf("IsSdCardMountPoint(%q) = %v, want %v", tt.path, got, tt.want)
			}
		})
	}
}

func TestParseSdCardList_Primary(t *testing.T) {
	output := "Volume list:\nprimary: mounted\nprivate: unmounted\n"
	got := ParseSdCardList(output)
	if len(got) != 1 {
		t.Fatalf("expected 1 mounted card, got %d (%v)", len(got), got)
	}
	if got[0].ID != "primary" {
		t.Errorf("ID = %q, want %q", got[0].ID, "primary")
	}
	if got[0].MountPoint != "/storage/emulated/0" {
		t.Errorf("MountPoint = %q, want %q", got[0].MountPoint, "/storage/emulated/0")
	}
	if got[0].IsExternal {
		t.Error("primary volume should not be external")
	}
	if got[0].Description != "Internal SD card" {
		t.Errorf("Description = %q, want %q", got[0].Description, "Internal SD card")
	}
}

func TestParseSdCardList_ExternalUuid(t *testing.T) {
	output := "1234-5678: mounted\n"
	got := ParseSdCardList(output)
	if len(got) != 1 {
		t.Fatalf("expected 1 mounted card, got %d", len(got))
	}
	if got[0].ID != "1234-5678" {
		t.Errorf("ID = %q, want %q", got[0].ID, "1234-5678")
	}
	if got[0].MountPoint != "/storage/1234-5678" {
		t.Errorf("MountPoint = %q, want %q", got[0].MountPoint, "/storage/1234-5678")
	}
	if !got[0].IsExternal {
		t.Error("UUID volume should be external")
	}
}

func TestParseSdCardList_ExternalLabel(t *testing.T) {
	output := "external_SD1: mounted\n"
	got := ParseSdCardList(output)
	if len(got) != 1 {
		t.Fatalf("expected 1 card, got %d", len(got))
	}
	if !got[0].IsExternal {
		t.Error("external_SD1 should be external")
	}
	if got[0].Description != "External SD card" {
		t.Errorf("Description = %q, want %q", got[0].Description, "External SD card")
	}
}

func TestParseSdCardList_SkipsUnmounted(t *testing.T) {
	output := "primary: mounted\nprivate: unmounted\n1234-5678: unmountable\n"
	got := ParseSdCardList(output)
	if len(got) != 1 {
		t.Fatalf("expected only 1 mounted card, got %d (%v)", len(got), got)
	}
	if got[0].ID != "primary" {
		t.Errorf("ID = %q, want %q", got[0].ID, "primary")
	}
}

func TestParseSdCardList_HandlesMalformed(t *testing.T) {
	output := "Volume list:\n  \nbad-line\nprimary: mounted\n:\n"
	got := ParseSdCardList(output)
	if len(got) != 1 {
		t.Fatalf("expected 1 well-formed card, got %d (%v)", len(got), got)
	}
	if got[0].ID != "primary" {
		t.Errorf("ID = %q, want %q", got[0].ID, "primary")
	}
}

func TestParseSdCardList_Empty(t *testing.T) {
	got := ParseSdCardList("")
	if len(got) != 0 {
		t.Errorf("expected empty result, got %v", got)
	}
}

func TestPathClassString(t *testing.T) {
	if PathPublic.String() != "public" {
		t.Errorf("PathPublic.String() = %q, want %q", PathPublic.String(), "public")
	}
	if PathProtected.String() != "protected" {
		t.Errorf("PathProtected.String() = %q, want %q", PathProtected.String(), "protected")
	}
	if PathSystem.String() != "system" {
		t.Errorf("PathSystem.String() = %q, want %q", PathSystem.String(), "system")
	}
	if PathClass(99).String() != "public" {
		t.Error("unknown PathClass should default to public")
	}
}
