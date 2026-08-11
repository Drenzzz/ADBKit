package app

import (
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"ADBKit/internal/dialog"
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
		"wirelessPairingSupported": status.Adb.Status == core.BinaryReady,
		"audioCaptureSupported":    status.Scrcpy.Status == core.BinaryReady,
		"clipboardSyncSupported":   status.Scrcpy.Status == core.BinaryReady,
	}
}

func (a *App) SelectBinaryFile(name string) (string, error) {
	return a.diaSvc.SelectBinaryFile(name)
}

func (a *App) SelectPlatformToolsDirectory() (*dialog.PlatformToolsSelection, error) {
	return a.diaSvc.SelectPlatformToolsDirectory()
}
