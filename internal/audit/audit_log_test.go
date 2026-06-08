package audit

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestAuditLoggerCreatesPrivateStorage(t *testing.T) {
	dataDir := filepath.Join(t.TempDir(), "adbkit")
	logger, err := New(dataDir)
	if err != nil {
		t.Fatalf("expected audit logger to initialize: %v", err)
	}

	logger.LogWithDetails(LogLevelError, "test_operation", "Operation failed", "/home/user/secret/file.txt failed")

	dirInfo, err := os.Stat(dataDir)
	if err != nil {
		t.Fatalf("expected data directory to exist: %v", err)
	}
	if dirInfo.Mode().Perm() != 0o700 {
		t.Fatalf("expected data directory permission 0700, got %o", dirInfo.Mode().Perm())
	}

	logger.saveNow()

	logPath := filepath.Join(dataDir, "audit.json")
	logInfo, err := os.Stat(logPath)
	if err != nil {
		t.Fatalf("expected audit log file to exist: %v", err)
	}
	if logInfo.Mode().Perm() != 0o600 {
		t.Fatalf("expected audit log permission 0600, got %o", logInfo.Mode().Perm())
	}

	data, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatalf("expected audit log file to be readable: %v", err)
	}
	if strings.Contains(string(data), "/home/user/secret/file.txt") {
		t.Fatal("expected sensitive path to be redacted")
	}
	if !strings.Contains(string(data), "[redacted-path]") {
		t.Fatal("expected redacted path marker")
	}
}

func TestRedactAuditDetailsRedactsCommonPaths(t *testing.T) {
	redacted := RedactAuditDetails("failed at /tmp/adbkit/config.json and C:\\Users\\user\\secret.txt")
	if strings.Contains(redacted, "/tmp/adbkit/config.json") {
		t.Fatal("expected Unix path to be redaction")
	}
	if strings.Contains(redacted, `C:\Users\user\secret.txt`) {
		t.Fatal("expected Windows path to be redaction")
	}
	if !strings.Contains(redacted, "[redacted-path]") {
		t.Fatal("expected redaction marker in output")
	}
}

func TestLogOperationWithDetailsWritesSingleStructuredEntry(t *testing.T) {
	logger, err := New(t.TempDir())
	if err != nil {
		t.Fatalf("expected audit logger to initialize: %v", err)
	}

	logger.LogOperationWithDetails(
		"install_package",
		"Failed to install APK",
		"failed at /home/user/app.apk",
		"12ms",
		false,
	)

	entries := logger.Entries()
	if len(entries) != 1 {
		t.Fatalf("expected one audit entry, got %d", len(entries))
	}

	entry := entries[0]
	if entry.Level != LogLevelError {
		t.Fatalf("expected error level, got %s", entry.Level)
	}
	if entry.Success {
		t.Fatal("expected failed operation")
	}
	if entry.Duration != "12ms" {
		t.Fatalf("expected duration to be stored, got %s", entry.Duration)
	}
	if strings.Contains(entry.Details, "/home/user/app.apk") {
		t.Fatal("expected operation details to be redacted")
	}
	if !strings.Contains(entry.Details, "[redacted-path]") {
		t.Fatal("expected redacted path marker")
	}
	if entry.ID == 0 {
		t.Fatal("expected non-zero id from atomic counter")
	}
}
