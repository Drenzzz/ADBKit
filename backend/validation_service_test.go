package backend

import "testing"

func TestValidateFlashPartition(t *testing.T) {
	app := NewApp()

	if err := app.validateFlashPartition("boot"); err != nil {
		t.Fatalf("expected partition 'boot' to be valid, got: %v", err)
	}

	if err := app.validateFlashPartition("userdata"); err != nil {
		t.Fatalf("expected partition 'userdata' to be valid, got: %v", err)
	}

	if err := app.validateFlashPartition("critical"); err == nil {
		t.Fatal("expected partition 'critical' to be rejected")
	}
}

func TestValidateRemotePath(t *testing.T) {
	app := NewApp()

	if err := app.validateRemotePath("/sdcard/Download"); err != nil {
		t.Fatalf("expected remote path to be valid, got: %v", err)
	}

	if err := app.validateRemotePath(""); err == nil {
		t.Fatal("expected empty path to be rejected")
	}

	if err := app.validateRemotePath("/sdcard/line\nfeed"); err == nil {
		t.Fatal("expected newline in path to be rejected")
	}
}
