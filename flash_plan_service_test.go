package main

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestPartitionNameFromImage_Valid(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"boot.img", "boot"},
		{"system.img", "system"},
		{"vbmeta.img", "vbmeta"},
		{"BOOT.IMG", "boot"},
		{"init_boot.img", "init_boot"},
	}
	for _, tt := range tests {
		got, ok := partitionNameFromImage(tt.input)
		if !ok {
			t.Errorf("partitionNameFromImage(%q) returned false", tt.input)
			continue
		}
		if got != tt.want {
			t.Errorf("partitionNameFromImage(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestPartitionNameFromImage_NonImg(t *testing.T) {
	tests := []string{"boot.zip", "system.bin", "payload.bin", "meta.txt", ""}
	for _, tt := range tests {
		_, ok := partitionNameFromImage(tt)
		if ok {
			t.Errorf("partitionNameFromImage(%q) should return false for non-.img", tt)
		}
	}
}

func TestBuildOrderedFlashSteps_PriorityOrder(t *testing.T) {
	foundImages := map[string]string{
		"system":  "/rom/system.img",
		"boot":    "/rom/boot.img",
		"vendor":  "/rom/vendor.img",
		"vbmeta":  "/rom/vbmeta.img",
		"product": "/rom/product.img",
	}
	steps := buildOrderedFlashSteps(foundImages)
	if len(steps) != 5 {
		t.Fatalf("expected 5 steps, got %d", len(steps))
	}
	expectedOrder := []string{"boot", "vbmeta", "system", "vendor", "product"}
	for i, exp := range expectedOrder {
		if steps[i].Partition != exp {
			t.Errorf("step %d: expected %q, got %q", i, exp, steps[i].Partition)
		}
	}
}

func TestBuildOrderedFlashSteps_LeftoversSorted(t *testing.T) {
	// Use partitions NOT in the priority list so they all end up as leftovers
	foundImages := map[string]string{
		"omega": "/rom/omega.img",
		"alpha": "/rom/alpha.img",
		"gamma": "/rom/gamma.img",
	}
	steps := buildOrderedFlashSteps(foundImages)
	if len(steps) != 3 {
		t.Fatalf("expected 3 steps, got %d", len(steps))
	}
	got := make([]string, len(steps))
	for i, s := range steps {
		got[i] = s.Partition
	}
	expectedOrder := []string{"alpha", "gamma", "omega"}
	for i, exp := range expectedOrder {
		if got[i] != exp {
			t.Errorf("step %d: expected %q, got %q (full order: %v)", i, exp, got[i], got)
		}
	}
}

func TestBuildOrderedFlashSteps_Empty(t *testing.T) {
	steps := buildOrderedFlashSteps(map[string]string{})
	if len(steps) != 0 {
		t.Errorf("expected 0 steps, got %d", len(steps))
	}
}

func TestScanRomFolder_Empty(t *testing.T) {
	svc := &FlashPlanService{}
	_, err := svc.ScanRomFolder("")
	if err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestScanRomFolder_NotExist(t *testing.T) {
	svc := &FlashPlanService{}
	_, err := svc.ScanRomFolder("/nonexistent/rom/folder")
	if err == nil {
		t.Fatal("expected error for nonexistent folder")
	}
}

func TestScanRomFolder_IsFile(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "notadir")
	os.WriteFile(f, []byte("data"), 0o644)
	svc := &FlashPlanService{}
	_, err := svc.ScanRomFolder(f)
	if err == nil {
		t.Fatal("expected error for file path")
	}
}

func TestScanRomFolder_WithImages(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "boot.img"), []byte("boot"), 0o644)
	os.WriteFile(filepath.Join(dir, "system.img"), []byte("system"), 0o644)
	os.WriteFile(filepath.Join(dir, "vbmeta.img"), []byte("vbmeta"), 0o644)
	os.WriteFile(filepath.Join(dir, "README.txt"), []byte("ignore"), 0o644)
	os.WriteFile(filepath.Join(dir, "payload.bin"), []byte("ignore"), 0o644)
	svc := &FlashPlanService{}
	plan, err := svc.ScanRomFolder(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(plan.Steps) != 3 {
		t.Fatalf("expected 3 steps, got %d", len(plan.Steps))
	}
	if plan.Steps[0].Partition != "boot" {
		t.Errorf("expected boot first, got %q", plan.Steps[0].Partition)
	}
}

func TestFlashRomFolder_EmptyPlan(t *testing.T) {
	svc := &FlashPlanService{fastbootService: &FastbootService{}}
	_, err := svc.FlashRomFolder(context.Background(), "", "/rom", FlashPlan{Steps: []FlashStep{}})
	if err == nil {
		t.Fatal("expected error for empty plan")
	}
}

func TestFlashRomFolder_EmptyPath(t *testing.T) {
	svc := &FlashPlanService{fastbootService: &FastbootService{}}
	_, err := svc.FlashRomFolder(context.Background(), "", "", FlashPlan{Steps: []FlashStep{{Partition: "boot", ImageFile: "/x"}}})
	if err == nil {
		t.Fatal("expected error for empty path")
	}
}

func TestFlashRomFolder_MissingImage(t *testing.T) {
	dir := t.TempDir()
	svc := &FlashPlanService{fastbootService: &FastbootService{}}
	plan := FlashPlan{Steps: []FlashStep{{Partition: "boot", ImageFile: filepath.Join(dir, "missing.img")}}}
	_, err := svc.FlashRomFolder(context.Background(), "", dir, plan)
	if err == nil {
		t.Fatal("expected error for missing image")
	}
}

func TestFlashRomFolder_ImageOutsideFolder(t *testing.T) {
	dir := t.TempDir()
	outsideDir := t.TempDir()
	img := filepath.Join(outsideDir, "boot.img")
	os.WriteFile(img, []byte("boot"), 0o644)
	svc := &FlashPlanService{fastbootService: &FastbootService{}}
	plan := FlashPlan{Steps: []FlashStep{{Partition: "boot", ImageFile: img}}}
	_, err := svc.FlashRomFolder(context.Background(), "", dir, plan)
	if err == nil {
		t.Fatal("expected error for image outside folder")
	}
}
