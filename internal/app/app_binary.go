package app

import (
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"ADBKit/internal/dialog"
	"regexp"
	"strconv"
)

func (a *App) GetBinaryStatus() *binary.BinarySetupResult {
	return a.binSvc.GetBinaryStatus(a.cfg)
}

func (a *App) GetSetupState() *binary.SetupState {
	return a.binSvc.GetSetupState(a.cfg)
}

func (a *App) RetryBinaryDetection() (*binary.BinarySetupResult, error) {
	return auditAction(a, "retry_binary_detection", func() (*binary.BinarySetupResult, error) {
		a.mu.Lock()
		result := a.binSvc.RevalidateConfig(a.cfg)
		a.mu.Unlock()
		if result.Changed {
			if err := core.SaveConfig(a.dataDir, a.cfg); err != nil {
				return nil, err
			}
		}
		return result.Status, nil
	})
}

func (a *App) SetCustomBinary(name string, path string) error {
	return auditVoidAction(a, "set_custom_binary", func() error {
		a.mu.Lock()
		defer a.mu.Unlock()
		if err := a.binSvc.SetCustomBinary(a.cfg, name, path); err != nil {
			return err
		}
		return core.SaveConfig(a.dataDir, a.cfg)
	})
}

func (a *App) ClearCustomBinary(name string) error {
	return auditVoidAction(a, "clear_custom_binary", func() error {
		a.mu.Lock()
		defer a.mu.Unlock()
		if err := a.binSvc.ClearCustomBinary(a.cfg, name); err != nil {
			return err
		}
		return core.SaveConfig(a.dataDir, a.cfg)
	})
}

func (a *App) CompleteSetup() (*binary.SetupState, error) {
	return auditAction(a, "complete_setup", func() (*binary.SetupState, error) {
		a.mu.Lock()
		state, err := a.binSvc.CompleteSetup(a.cfg)
		a.mu.Unlock()
		if err != nil {
			return nil, err
		}
		if err := core.SaveConfig(a.dataDir, a.cfg); err != nil {
			return nil, err
		}
		return state, nil
	})
}

func (a *App) GetManagedBinaryDir() string {
	return a.binSvc.GetManagedBinaryDir()
}

func (a *App) ListManagedBinaries() ([]string, error) {
	return a.binSvc.ListManagedBinaries()
}

func (a *App) GetCapabilities() map[string]bool {
	a.mu.Lock()
	status := a.binSvc.GetBinaryStatus(a.cfg)
	a.mu.Unlock()
	return map[string]bool{
		"adbAvailable":             status.Adb.Status == core.BinaryReady,
		"fastbootAvailable":        status.Fastboot.Status == core.BinaryReady,
		"scrcpyAvailable":          status.Scrcpy.Status == core.BinaryReady,
		"setupCompleted":           a.cfg.SetupCompleted && status.Ready,
		"wirelessPairingSupported": wirelessPairingSupported(status.Adb),
		"clipboardSyncSupported":   status.Scrcpy.Status == core.BinaryReady,
		"audioCaptureSupported":    audioCaptureSupported(status.Scrcpy),
	}
}

// audioCaptureSupported reports whether scrcpy-based audio capture is available.
// Conservative v1: gated on scrcpy being Ready (same prerequisite as recording).
// A future revision will probe the host audio backend (PulseAudio/PipeWire on
// Linux, core audio on macOS, WASAPI on Windows) before reporting true.
func audioCaptureSupported(scrcpy *core.BinaryInfo) bool {
	if scrcpy == nil {
		return false
	}
	return scrcpy.Status == core.BinaryReady
}

// wirelessPairingSupported reports whether the adb binary supports the
// `adb pair <host:port> <code>` flow. `adb pair` was introduced in
// platform-tools 30.0.0. We accept anything that parses to >= 30, fall back
// to "supported" when the version string is missing or unparseable (modern
// installs are widespread and the runtime call will fail with a clear error
// if not supported).
func wirelessPairingSupported(adb *core.BinaryInfo) bool {
	if adb == nil || adb.Status != core.BinaryReady {
		return false
	}
	if adb.Version == "" {
		return true
	}
	major, ok := parseAdbMajorVersion(adb.Version)
	if !ok {
		return true
	}
	return major >= 30
}

// parseAdbMajorVersion extracts the major component from the platform-tools
// version in the adb version string (which also includes the smaller adb
// client version, e.g. "Android Debug Bridge version 1.0.41 (Version
// 35.0.1-12147458)"). We prefer the bracketed "Version N.N.N" component
// because that maps to the platform-tools release that introduced `adb pair`.
func parseAdbMajorVersion(version string) (int, bool) {
	bracketed := regexp.MustCompile(`Version\s+(\d+)\.(\d+)(?:\.(\d+))?`)
	if match := bracketed.FindStringSubmatch(version); len(match) >= 2 {
		n, err := strconv.Atoi(match[1])
		if err == nil {
			return n, true
		}
	}
	fallback := regexp.MustCompile(`(\d+)\.(\d+)(?:\.(\d+))?`)
	match := fallback.FindStringSubmatch(version)
	if len(match) < 2 {
		return 0, false
	}
	n, err := strconv.Atoi(match[1])
	if err != nil {
		return 0, false
	}
	return n, true
}

func (a *App) SelectBinaryFile(name string) (string, error) {
	return a.diaSvc.SelectBinaryFile(name)
}

func (a *App) SelectPlatformToolsDirectory() (*dialog.PlatformToolsSelection, error) {
	return a.diaSvc.SelectPlatformToolsDirectory()
}

func (a *App) SelectScrcpyDirectory() (*dialog.ScrcpyDirectorySelection, error) {
	return a.diaSvc.SelectScrcpyDirectory()
}
