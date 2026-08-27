package flasher

import (
	"testing"
)

func TestBuildOrderedFlashSteps_OrdersByPriority(t *testing.T) {
	input := map[string]string{
		"system":    "/rom/system.img",
		"boot":      "/rom/boot.img",
		"vendor":    "/rom/vendor.img",
		"random":    "/rom/random.img",
		"ota":       "/rom/ota.img",
	}
	steps := buildOrderedFlashSteps(input)
	if len(steps) != len(input) {
		t.Fatalf("expected %d steps, got %d", len(input), len(steps))
	}

	// Priority partitions come first (boot, system, vendor), then unknown
	// partitions are emitted in alphabetical order (ota, random).
	wantOrder := []string{"boot", "system", "vendor", "ota", "random"}
	for i, want := range wantOrder {
		if steps[i].Partition != want {
			t.Errorf("step[%d] = %q, want %q", i, steps[i].Partition, want)
		}
	}
}

func TestBuildOrderedFlashSteps_IgnoresEmptyInput(t *testing.T) {
	steps := buildOrderedFlashSteps(map[string]string{})
	if len(steps) != 0 {
		t.Errorf("expected no steps for empty input, got %d", len(steps))
	}
}

func TestPartitionNameFromImage(t *testing.T) {
	cases := []struct {
		name      string
		input     string
		wantPart  string
		wantFound bool
	}{
		{"boot img", "boot.img", "boot", true},
		{"system ext", "system_ext.img", "system_ext", true},
		{"non img", "boot.txt", "", false},
		{"uppercase IMG", "BOOT.IMG", "boot", true},
		{"empty", "", "", false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			gotPart, gotFound := partitionNameFromImage(c.input)
			if gotFound != c.wantFound {
				t.Fatalf("partitionNameFromImage(%q) found = %v, want %v", c.input, gotFound, c.wantFound)
			}
			if gotFound && gotPart != c.wantPart {
				t.Errorf("partitionNameFromImage(%q) = %q, want %q", c.input, gotPart, c.wantPart)
			}
		})
	}
}