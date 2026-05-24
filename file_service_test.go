package main

import (
	"context"
	"testing"
)

func TestParseFileListOutputFiltersHiddenEntries(t *testing.T) {
	output := "drwxrwx--- 2 u0_a123 u0_a123 4096 2024-01-15 12:30 Pictures\n-rw-rw---- 1 u0_a123 u0_a123 2048 2024-01-15 12:31 .nomedia\n-rw-rw---- 1 u0_a123 u0_a123 1024 2024-01-15 12:32 photo.jpg\n"

	entries, err := parseFileListOutput(output, "/sdcard", false)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("expected 2 visible entries, got %d", len(entries))
	}

	if entries[0].Name != "Pictures" {
		t.Fatalf("expected first entry to be Pictures, got %s", entries[0].Name)
	}

	if entries[1].Name != "photo.jpg" {
		t.Fatalf("expected second entry to be photo.jpg, got %s", entries[1].Name)
	}
	if entries[1].SizeHuman != "1.0 KB" {
		t.Fatalf("expected file size to be formatted, got %s", entries[1].SizeHuman)
	}
}

func TestParseFileListOutputKeepsHiddenEntriesWhenEnabled(t *testing.T) {
	output := "-rw-rw---- 1 u0_a123 u0_a123 2048 2024-01-15 12:31 .nomedia\n"

	entries, err := parseFileListOutput(output, "/sdcard", true)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(entries) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(entries))
	}

	if !entries[0].IsHidden {
		t.Fatal("expected entry to be marked hidden")
	}
}

func TestParseFileListLineParsesSymlinkName(t *testing.T) {
	line := "lrwxrwxrwx 1 root root 11 2024-01-15 12:31 current -> release-1"

	entry, ok, err := parseFileListLine(line, "/sdcard")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !ok {
		t.Fatal("expected line to produce entry")
	}
	if entry.Type != fileSymlinkType {
		t.Fatalf("expected symlink type, got %s", entry.Type)
	}
	if entry.Name != "current" {
		t.Fatalf("expected symlink name without target, got %s", entry.Name)
	}
}

func TestNormalizeRemotePathUsesDefaultPath(t *testing.T) {
	value, err := normalizeRemotePath("")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if value != "/sdcard" {
		t.Fatalf("expected default path /sdcard, got %s", value)
	}
}

func TestNormalizeRemotePathRejectsInvalidCharacters(t *testing.T) {
	_, err := normalizeRemotePath("/sdcard/Bad\nName")
	if err == nil {
		t.Fatal("expected validation error")
	}
}

func TestValidateRemoteMutationPathRejectsDeviceRoot(t *testing.T) {
	if err := validateRemoteMutationPath("delete_file", "/"); err == nil {
		t.Fatal("expected device root mutation to be rejected")
	}
}

func TestValidateRemoteMutationPathRejectsProtectedPath(t *testing.T) {
	if err := validateRemoteMutationPath("delete_file", "/system"); err == nil {
		t.Fatal("expected protected path mutation to be rejected")
	}
}

func TestValidateRemoteMutationPathAllowsScopedStoragePath(t *testing.T) {
	if err := validateRemoteMutationPath("delete_file", "/sdcard/Download/sample.txt"); err != nil {
		t.Fatalf("expected scoped storage path to be allowed, got %v", err)
	}
}

func TestParseDirectorySizeOutput(t *testing.T) {
	output := "24M\t/sdcard/DCIM\n"
	if value := parseDirectorySizeOutput(output); value != "24M" {
		t.Fatalf("expected 24M, got %s", value)
	}
}

func TestQuoteShellArgEscapesSingleQuote(t *testing.T) {
	quoted := quoteShellArg("/sdcard/John's Folder")
	expected := "'/sdcard/John'\"'\"'s Folder'"
	if quoted != expected {
		t.Fatalf("expected %s, got %s", expected, quoted)
	}
}

func TestFormatFileSize(t *testing.T) {
	tests := []struct {
		input    int64
		expected string
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
		if got := formatFileSize(tt.input); got != tt.expected {
			t.Errorf("formatFileSize(%d) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestParseStorageInfoOutput(t *testing.T) {
	output := "Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/fuse      115273600 68436096  46837504  60% /storage/emulated\n"
	info, err := parseStorageInfoOutput(output)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if info.UsedPct != 60 {
		t.Fatalf("expected 60%%, got %d%%", info.UsedPct)
	}
	if info.TotalBytes != 115273600*1024 {
		t.Fatalf("unexpected total bytes: %d", info.TotalBytes)
	}
}

func TestParseStorageInfoOutputEmpty(t *testing.T) {
	_, err := parseStorageInfoOutput("")
	if err == nil {
		t.Fatal("expected error for empty output")
	}
}

func TestParseFileType(t *testing.T) {
	if got := parseFileType("drwxrwx---"); got != fileDirType {
		t.Errorf("expected directory, got %s", got)
	}
	if got := parseFileType("-rw-rw----"); got != fileRegularType {
		t.Errorf("expected file, got %s", got)
	}
	if got := parseFileType("lrwxrwxrwx"); got != fileSymlinkType {
		t.Errorf("expected symlink, got %s", got)
	}
	if got := parseFileType(""); got != fileOtherType {
		t.Errorf("expected other, got %s", got)
	}
}

func TestIsTransientADBError(t *testing.T) {
	if !isTransientADBError("error: device offline") {
		t.Error("expected device offline to be transient")
	}
	if !isTransientADBError("error: no such device") {
		t.Error("expected no such device to be transient")
	}
	if isTransientADBError("permission denied") {
		t.Error("expected permission denied to NOT be transient")
	}
	if isTransientADBError("") {
		t.Error("expected empty to NOT be transient")
	}
}

func TestFileService_ListFilesRequiresSerial(t *testing.T) {
	s := NewFileService(context.Background(), nil)
	_, err := s.ListFiles(context.Background(), "/sdcard", false)
	if err == nil {
		t.Fatal("expected error when resolver is nil")
	}
}

func TestFileService_DeleteRejectsProtectedPath(t *testing.T) {
	s := NewFileService(context.Background(), func(ctx context.Context) (string, error) {
		return "SER123", nil
	})
	_, err := s.DeleteFile(context.Background(), "/system/build.prop")
	if err == nil {
		t.Fatal("expected error for protected path")
	}
}

func TestFileService_PushRejectsEmptyPath(t *testing.T) {
	s := NewFileService(context.Background(), nil)
	_, err := s.PushFile(context.Background(), "", "/sdcard/test.txt")
	if err == nil {
		t.Fatal("expected error for empty local path")
	}
}

func TestFileService_PullRejectsEmptyDestination(t *testing.T) {
	s := NewFileService(context.Background(), func(ctx context.Context) (string, error) {
		return "SER123", nil
	})
	_, err := s.PullFile(context.Background(), "/sdcard/test.txt", "")
	if err == nil {
		t.Fatal("expected error for empty destination")
	}
}

func TestFileService_DeleteMultipleRequiresPaths(t *testing.T) {
	s := NewFileService(context.Background(), nil)
	_, err := s.DeleteMultipleFiles(context.Background(), []string{})
	if err == nil {
		t.Fatal("expected error for empty paths")
	}
}

func TestFileService_PushMultipleRequiresPaths(t *testing.T) {
	s := NewFileService(context.Background(), nil)
	_, err := s.PushMultipleFiles(context.Background(), []string{}, "/sdcard")
	if err == nil {
		t.Fatal("expected error for empty paths")
	}
}
