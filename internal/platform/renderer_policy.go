package platform

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

const (
	webkitDisableDMABUFRenderer = "WEBKIT_DISABLE_DMABUF_RENDERER"
	adbkitDMABUFOverride        = "ADBKit_WEBKIT_DISABLE_DMABUF_RENDERER"
	drmClassPath                = "/sys/class/drm"
)

// ConfigureWebKitRenderer avoids Wails' NVIDIA-presence heuristic on hybrid
// laptops while keeping an explicit escape hatch for problematic drivers.
func ConfigureWebKitRenderer() {
	if runtime.GOOS != "linux" {
		return
	}

	if override := os.Getenv(adbkitDMABUFOverride); override == "0" || override == "1" {
		_ = os.Setenv(webkitDisableDMABUFRenderer, override)
		return
	}

	// An explicit enable request must win over platform detection.
	if os.Getenv(webkitDisableDMABUFRenderer) == "0" {
		return
	}

	drivers, known := activeDisplayDrivers(drmClassPath)
	if !known {
		return
	}

	if activeNVIDIADriver(drivers) {
		_ = os.Setenv(webkitDisableDMABUFRenderer, "1")
		return
	}

	_ = os.Setenv(webkitDisableDMABUFRenderer, "0")
}

func activeDisplayDrivers(root string) ([]string, bool) {
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil, false
	}

	var drivers []string
	foundConnected := false
	for _, entry := range entries {
		name := entry.Name()
		if !strings.HasPrefix(name, "card") || !strings.Contains(name, "-") {
			continue
		}

		status, err := os.ReadFile(filepath.Join(root, name, "status"))
		if err != nil || strings.TrimSpace(string(status)) != "connected" {
			continue
		}
		foundConnected = true

		cardName := strings.SplitN(name, "-", 2)[0]
		driverPath := filepath.Join(root, cardName, "device", "driver")
		resolved, err := filepath.EvalSymlinks(driverPath)
		if err != nil {
			return nil, false
		}
		driver := filepath.Base(resolved)
		if driver == "." || driver == string(filepath.Separator) || driver == "" {
			return nil, false
		}
		drivers = appendUnique(drivers, strings.ToLower(driver))
	}

	if !foundConnected || len(drivers) == 0 {
		return nil, false
	}
	return drivers, true
}

func appendUnique(values []string, value string) []string {
	for _, existing := range values {
		if existing == value {
			return values
		}
	}
	return append(values, value)
}

func activeNVIDIADriver(drivers []string) bool {
	for _, driver := range drivers {
		if strings.Contains(driver, "nvidia") {
			return true
		}
	}
	return false
}
