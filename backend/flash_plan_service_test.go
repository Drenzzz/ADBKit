package backend

import (
	"os"
	"path/filepath"
	"testing"
)

func TestScanRomFolderBuildsPrioritizedPlan(t *testing.T) {
	app := NewApp()

	tempDir := t.TempDir()
	files := []string{"system.img", "boot.img", "vendor.img", "README.txt", "vbmeta.img"}
	for _, name := range files {
		fullPath := filepath.Join(tempDir, name)
		if err := os.WriteFile(fullPath, []byte("x"), 0o644); err != nil {
			t.Fatalf("failed to create test file %s: %v", name, err)
		}
	}

	plan, err := app.ScanRomFolder(tempDir)
	if err != nil {
		t.Fatalf("expected scan to succeed, got: %v", err)
	}

	if len(plan.Steps) < 3 {
		t.Fatalf("expected at least 3 flash steps, got: %d", len(plan.Steps))
	}

	firstPartition := plan.Steps[0].Partition
	if firstPartition != "boot" {
		t.Fatalf("expected first partition to be boot, got: %s", firstPartition)
	}
}
