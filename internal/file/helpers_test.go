package file

import (
	"strings"
	"testing"
)

func TestNormalizeRemotePath(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{"empty defaults to sdcard", "", "/sdcard", false},
		{"whitespace defaults to sdcard", "   ", "/sdcard", false},
		{"normal absolute path", "/sdcard/Download", "/sdcard/Download", false},
		{"relative path gets leading slash", "sdcard/Download", "/sdcard/Download", false},
		{"path cleaning", "/sdcard//Download/../Music", "/sdcard/Music", false},
		{"root path stays root", "/", "/", false},
		{"dot cleans to root", ".", "/", false},
		{"null byte rejected", "/sdcard/\x00file", "", true},
		{"newline rejected", "/sdcard/\nfile", "", true},
		{"carriage return rejected", "/sdcard/\rfile", "", true},
		{"trailing slash cleaned", "/sdcard/Download/", "/sdcard/Download", false},
		{"deep path", "/a/b/c/d/e", "/a/b/c/d/e", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := normalizeRemotePath(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("normalizeRemotePath(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("normalizeRemotePath(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestValidateRemoteMutationPath(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		wantErr bool
	}{
		{"root rejected", "/", true},
		{"dot rejected", ".", true},
		{"sdcard allowed", "/sdcard/Download/file.txt", false},
		{"sdcard root allowed", "/sdcard", false},
		{"system blocked", "/system", true},
		{"system sub blocked", "/system/app/Chrome.apk", true},
		{"data blocked", "/data", true},
		{"data sub blocked", "/data/data/com.app", true},
		{"dev blocked", "/dev", true},
		{"proc blocked", "/proc", true},
		{"sys blocked", "/sys", true},
		{"etc blocked", "/etc", true},
		{"root home blocked", "/root", true},
		{"sbin blocked", "/sbin", true},
		{"bin blocked", "/bin", true},
		{"acct blocked", "/acct", true},
		{"apex blocked", "/apex", true},
		{"config blocked", "/config", true},
		{"init blocked", "/init", true},
		{"mnt blocked", "/mnt", true},
		{"product blocked", "/product", true},
		{"vendor blocked", "/vendor", true},
		{"vendor_dlkm blocked", "/vendor_dlkm", true},
		{"odm_dlkm blocked", "/odm_dlkm", true},
		{"metadata blocked", "/metadata", true},
		{"system_ext blocked", "/system_ext", true},
		{"tmp allowed", "/tmp", false},
		{"storage allowed", "/storage/emulated/0", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRemoteMutationPath("test_op", tt.path)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateRemoteMutationPath(%q) error = %v, wantErr %v", tt.path, err, tt.wantErr)
			}
		})
	}
}

func TestQuoteShellArg(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"simple path", "/sdcard/file.txt", "'/sdcard/file.txt'"},
		{"with spaces", "/sdcard/my file.txt", "'/sdcard/my file.txt'"},
		{"with single quote", "it's", "'it'\"'\"'s'"},
		{"empty", "", "''"},
		{"multiple quotes", "a'b'c", "'a'\"'\"'b'\"'\"'c'"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := quoteShellArg(tt.input)
			if got != tt.want {
				t.Errorf("quoteShellArg(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestParseFileListOutput(t *testing.T) {
	t.Run("empty output", func(t *testing.T) {
		entries, err := parseFileListOutput("", "/sdcard", false)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(entries) != 0 {
			t.Errorf("expected 0 entries, got %d", len(entries))
		}
	})

	t.Run("parses valid ls output", func(t *testing.T) {
		output := "drwxrwx--x  3 root sdcard_rw 4096 2024-01-15 10:30 Download\n" +
			"-rw-rw----  1 root sdcard_rw 1234 2024-01-15 11:00 file.txt\n"
		entries, err := parseFileListOutput(output, "/sdcard", false)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(entries) != 2 {
			t.Fatalf("expected 2 entries, got %d", len(entries))
		}
		if entries[0].Name != "Download" {
			t.Errorf("expected first entry 'Download', got %q", entries[0].Name)
		}
		if entries[0].Type != dirType {
			t.Errorf("expected first entry type %q, got %q", dirType, entries[0].Type)
		}
		if entries[1].Name != "file.txt" {
			t.Errorf("expected second entry 'file.txt', got %q", entries[1].Name)
		}
		if entries[1].Type != regularType {
			t.Errorf("expected second entry type %q, got %q", regularType, entries[1].Type)
		}
	})

	t.Run("filters hidden files", func(t *testing.T) {
		output := "-rw-rw----  1 root sdcard_rw 100 2024-01-15 10:00 .hidden\n" +
			"-rw-rw----  1 root sdcard_rw 200 2024-01-15 10:00 visible.txt\n"
		entries, err := parseFileListOutput(output, "/sdcard", false)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(entries) != 1 {
			t.Fatalf("expected 1 entry (hidden filtered), got %d", len(entries))
		}
		if entries[0].Name != "visible.txt" {
			t.Errorf("expected 'visible.txt', got %q", entries[0].Name)
		}
	})

	t.Run("shows hidden files when enabled", func(t *testing.T) {
		output := "-rw-rw----  1 root sdcard_rw 100 2024-01-15 10:00 .hidden\n"
		entries, err := parseFileListOutput(output, "/sdcard", true)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(entries) != 1 {
			t.Fatalf("expected 1 entry, got %d", len(entries))
		}
		if !entries[0].IsHidden {
			t.Error("expected entry to be marked as hidden")
		}
	})
}

func TestFormatFileSize(t *testing.T) {
	tests := []struct {
		size int64
		want string
	}{
		{0, "0 B"},
		{512, "512 B"},
		{1024, "1.0 KB"},
		{1536, "1.5 KB"},
		{1048576, "1.0 MB"},
		{1073741824, "1.0 GB"},
		{-1, "-"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := formatFileSize(tt.size)
			if got != tt.want {
				t.Errorf("formatFileSize(%d) = %q, want %q", tt.size, got, tt.want)
			}
		})
	}
}

func TestIsTransientADBError(t *testing.T) {
	tests := []struct {
		name   string
		detail string
		want   bool
	}{
		{"empty", "", false},
		{"device offline", "error: device offline", true},
		{"device not found", "error: device not found", true},
		{"no such device", "no such device", true},
		{"connection reset", "connection reset by peer", true},
		{"broken pipe", "broken pipe", true},
		{"transport error", "transport error", true},
		{"permission denied", "permission denied", false},
		{"normal error", "command failed", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isTransientADBError(tt.detail)
			if got != tt.want {
				t.Errorf("isTransientADBError(%q) = %v, want %v", tt.detail, got, tt.want)
			}
		})
	}
}

func TestJoinRemotePath(t *testing.T) {
	tests := []struct {
		parent string
		name   string
		want   string
	}{
		{"/sdcard", "file.txt", "/sdcard/file.txt"},
		{"/sdcard", "/file.txt", "/sdcard/file.txt"},
		{"", "file.txt", "/file.txt"},
		{"/sdcard", "", "/sdcard"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := joinRemotePath(tt.parent, tt.name)
			if got != tt.want {
				t.Errorf("joinRemotePath(%q, %q) = %q, want %q", tt.parent, tt.name, got, tt.want)
			}
		})
	}
}

func TestParseFileListLine(t *testing.T) {
	t.Run("parses directory entry", func(t *testing.T) {
		line := "drwxrwx--x  3 root sdcard_rw 4096 2024-01-15 10:30 Download"
		entry, ok, err := parseFileListLine(line, "/sdcard")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !ok {
			t.Fatal("expected entry to be parsed")
		}
		if entry.Name != "Download" {
			t.Errorf("expected name 'Download', got %q", entry.Name)
		}
		if entry.Path != "/sdcard/Download" {
			t.Errorf("expected path '/sdcard/Download', got %q", entry.Path)
		}
		if entry.Type != dirType {
			t.Errorf("expected type %q, got %q", dirType, entry.Type)
		}
	})

	t.Run("skips . and ..", func(t *testing.T) {
		line := "drwxrwx--x  2 root sdcard_rw 4096 2024-01-15 10:30 ."
		_, ok, err := parseFileListLine(line, "/sdcard")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if ok {
			t.Error("expected '.' to be skipped")
		}
	})

	t.Run("parses file with spaces in name", func(t *testing.T) {
		line := "-rw-rw----  1 root sdcard_rw 1234 2024-01-15 11:00 my file.txt"
		entry, ok, err := parseFileListLine(line, "/sdcard")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !ok {
			t.Fatal("expected entry to be parsed")
		}
		if !strings.Contains(entry.Name, "my file.txt") {
			t.Errorf("expected name containing 'my file.txt', got %q", entry.Name)
		}
	})
}
