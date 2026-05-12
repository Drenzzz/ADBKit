package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"sync"
)

type App struct {
	ctx           context.Context
	auditLog      *AuditLog
	binaryService *BinaryService
	config        *AppConfig
	dataDir       string
	mu            sync.Mutex
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dataDir, err := appDataDir()
	if err != nil {
		log.Printf("failed to get app data dir: %v", err)
		dataDir = "."
	}
	a.dataDir = dataDir
	if err := os.MkdirAll(a.dataDir, 0o700); err != nil {
		log.Printf("failed to create app data dir: %v", err)
	}

	config, err := LoadConfig(a.dataDir)
	if err != nil {
		log.Printf("failed to load config: %v", err)
		config = DefaultConfig()
	}
	a.config = config
	a.binaryService = NewBinaryService(a.dataDir)

	al, err := NewAuditLog(a.dataDir)
	if err != nil {
		log.Printf("failed to init audit log: %v", err)
	}
	a.auditLog = al
}

func appDataDir() (string, error) {
	switch runtime.GOOS {
	case "linux":
		base := os.Getenv("XDG_DATA_HOME")
		if base == "" {
			home, err := os.UserHomeDir()
			if err != nil {
				return "", err
			}
			base = filepath.Join(home, ".local", "share")
		}
		return filepath.Join(base, "adbkit"), nil
	case "windows":
		base := os.Getenv("APPDATA")
		if base != "" {
			return filepath.Join(base, "adbkit"), nil
		}
	case "darwin":
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, "Library", "Application Support", "adbkit"), nil
	}

	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "adbkit"), nil
}

func (a *App) Greet(name string) string {
	return "Hello " + name + ", It's show time!"
}

func (a *App) GetBinaryStatus() *BinarySetupResult {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.binaryService.GetBinaryStatus(a.config)
}

func (a *App) GetSetupState() *SetupState {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.binaryService.GetSetupState(a.config)
}

func (a *App) RetryBinaryDetection() (*BinarySetupResult, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	result := a.binaryService.RevalidateConfig(a.config)
	if result.Changed {
		if err := SaveConfig(a.dataDir, a.config); err != nil {
			return nil, err
		}
	}
	return result.Status, nil
}

func (a *App) SetCustomBinary(name string, path string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if err := a.binaryService.SetCustomBinary(a.config, name, path); err != nil {
		return err
	}
	return SaveConfig(a.dataDir, a.config)
}

func (a *App) ClearCustomBinary(name string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if err := a.binaryService.ClearCustomBinary(a.config, name); err != nil {
		return err
	}
	return SaveConfig(a.dataDir, a.config)
}

func (a *App) CompleteSetup() (*SetupState, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	state, err := a.binaryService.CompleteSetup(a.config)
	if err != nil {
		return nil, err
	}
	if err := SaveConfig(a.dataDir, a.config); err != nil {
		return nil, err
	}
	return state, nil
}

func (a *App) GetManagedBinaryDir() string {
	return a.binaryService.GetManagedBinaryDir()
}

func (a *App) ListManagedBinaries() ([]string, error) {
	return a.binaryService.ListManagedBinaries()
}

func (a *App) GetCapabilities() map[string]bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	status := a.binaryService.GetBinaryStatus(a.config)
	return map[string]bool{
		"adbAvailable":             status.Adb.Status == BinaryReady,
		"fastbootAvailable":        status.Fastboot.Status == BinaryReady,
		"scrcpyAvailable":          status.Scrcpy.Status == BinaryReady,
		"setupCompleted":           a.config.SetupCompleted && status.Ready,
		"wirelessPairingSupported": status.Adb.Status == BinaryReady,
		"audioCaptureSupported":    status.Scrcpy.Status == BinaryReady,
		"clipboardSyncSupported":   status.Scrcpy.Status == BinaryReady,
	}
}
