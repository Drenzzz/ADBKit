package main

import (
	"ADBKit/internal/audit"
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"ADBKit/internal/device"
	"ADBKit/internal/dialog"
	"ADBKit/internal/download"
	"ADBKit/internal/file"
	"ADBKit/internal/flasher"
	packagemgr "ADBKit/internal/package_mgr"
	"ADBKit/internal/scrcpy"
	"ADBKit/internal/shell"
	"context"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"sync"
)

type App struct {
	ctx          context.Context
	dataDir      string
	activeSerial string
	mu           sync.Mutex

	binSvc  *binary.Service
	devSvc  *device.Service
	wireSvc *device.WirelessService
	monSvc  *device.MonitorService
	diaSvc  *dialog.Service
	pkgSvc  *packagemgr.Service
	fileSvc *file.Service
	termSvc *shell.TerminalService
	logSvc  *shell.LogcatService
	fbSvc   *flasher.FastbootService
	fpSvc   *flasher.PlanService
	scrSvc  *scrcpy.Service
	dlSvc   *download.Service
	auditLog *audit.Log
	cfg     *core.AppConfig
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

	config, err := core.LoadConfig(a.dataDir)
	if err != nil {
		log.Printf("failed to load config: %v", err)
		config = core.DefaultConfig()
	}
	a.cfg = config

	al, err := audit.New(a.dataDir)
	if err != nil {
		log.Printf("failed to init audit log: %v", err)
	}
	a.auditLog = al

	a.binSvc = binary.NewService(a.dataDir)
	getBinPath := core.GetBinaryPaths(a.cfg)
	a.devSvc = device.NewService(a.dataDir, getBinPath)
	a.wireSvc = device.NewWirelessService(a.dataDir, getBinPath)
	a.monSvc = device.NewMonitorService(a.dataDir, getBinPath)
	a.diaSvc = dialog.New(ctx)
	a.pkgSvc = packagemgr.NewService(a.resolveActiveSerial, a.diaSvc.SelectSaveFile, getBinPath)
	a.fileSvc = file.NewService(ctx, a.resolveActiveSerial, getBinPath)
	a.termSvc = shell.NewTerminalService(ctx, a.binSvc, a.currentConfig, a.resolveActiveSerial)
	a.logSvc = shell.NewLogcatService(ctx, a.binSvc, a.currentConfig)
	a.fbSvc = flasher.NewFastbootService(a.binSvc, a.currentConfig, a.resolveActiveSerial)
	a.fpSvc = flasher.NewPlanService(a.fbSvc)
	a.fpSvc.SetWailsContext(ctx)
	a.scrSvc = scrcpy.New(a.ctx, a.binSvc, a.currentConfig, a.resolveActiveSerial, a.diaSvc, a.auditLog)
	a.dlSvc = download.NewService(a.ctx, a.dataDir)
}

func (a *App) shutdown(ctx context.Context) {
	if a.logSvc != nil {
		a.logSvc.Shutdown()
	}
	if a.termSvc != nil {
		a.termSvc.Shutdown()
	}
	if a.scrSvc != nil {
		a.scrSvc.Shutdown()
	}
}

func (a *App) resolveActiveSerial(ctx context.Context) (string, error) {
	a.mu.Lock()
	serial := a.activeSerial
	a.mu.Unlock()

	if serial != "" {
		return serial, nil
	}

	devices, err := a.devSvc.ListDevices(ctx)
	if err != nil {
		return "", err
	}

	for _, d := range devices {
		if d.Mode == device.ModeADB && d.State == device.StateReady {
			a.mu.Lock()
			a.activeSerial = d.Serial
			a.mu.Unlock()
			return d.Serial, nil
		}
	}

	return "", core.NewOperationError("resolve_active_serial", "No active device is available", "no ready ADB device found", true)
}

func (a *App) currentConfig() *core.AppConfig {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.cfg
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
