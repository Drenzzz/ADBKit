package platform

import "testing"

func TestActiveNVIDIADriver(t *testing.T) {
	tests := []struct {
		name    string
		drivers []string
		want    bool
	}{
		{name: "intel", drivers: []string{"i915"}, want: false},
		{name: "nvidia", drivers: []string{"nvidia"}, want: true},
		{name: "nvidia drm", drivers: []string{"nvidia_drm"}, want: true},
		{name: "hybrid connected nvidia", drivers: []string{"i915", "nvidia"}, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := activeNVIDIADriver(tt.drivers); got != tt.want {
				t.Fatalf("activeNVIDIADriver(%v) = %v, want %v", tt.drivers, got, tt.want)
			}
		})
	}
}

func TestAppendUnique(t *testing.T) {
	values := appendUnique([]string{"i915"}, "i915")
	values = appendUnique(values, "nvidia")

	if len(values) != 2 || values[0] != "i915" || values[1] != "nvidia" {
		t.Fatalf("appendUnique result = %v", values)
	}
}
