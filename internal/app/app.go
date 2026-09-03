package app

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
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type App struct {
	ctx          context.Context
	dataDir      string
	activeSerial string
	mu           sync.Mutex

	binSvc   *binary.Service
	devSvc   *device.Service
	wireSvc  *device.WirelessService
	monSvc   *device.MonitorService
	diaSvc   *dialog.Service
	pkgSvc   *packagemgr.Service
	fileSvc  *file.Service
	termSvc  *shell.TerminalService
	logSvc   *shell.LogcatService
	fbSvc    *flasher.FastbootService
	fpSvc    *flasher.PlanService
	scrSvc   *scrcpy.Service
	dlSvc    *download.Service
	auditLog *audit.Log
	cfg      *core.AppConfig
}

func NewApp() *App {
	return &App{}
}

func (a *App) ServiceStartup(ctx context.Context, _ application.ServiceOptions) error {
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
	a.termSvc = shell.NewTerminalService(ctx, a.binSvc, a.currentConfig, a.resolveTerminalSerial)
	a.logSvc = shell.NewLogcatService(ctx, a.binSvc, a.currentConfig)
	a.fbSvc = flasher.NewFastbootService(a.binSvc, a.currentConfig, a.resolveActiveSerial)
	a.fpSvc = flasher.NewPlanService(a.fbSvc)
	a.fpSvc.SetWailsContext(ctx)
	a.scrSvc = scrcpy.New(a.ctx, a.binSvc, a.currentConfig, a.resolveActiveSerial, a.diaSvc, a.auditLog)
	a.dlSvc = download.NewService(a.ctx, a.dataDir)
	return nil
}

func (a *App) ServiceShutdown() error {
	if a.logSvc != nil {
		a.logSvc.Shutdown()
	}
	if a.termSvc != nil {
		a.termSvc.Shutdown()
	}
	if a.scrSvc != nil {
		a.scrSvc.Shutdown()
	}
	return nil
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

func (a *App) resolveTerminalSerial(ctx context.Context, mode string) (string, error) {
	if mode != shell.ModeFastboot {
		return a.resolveActiveSerial(ctx)
	}

	devices, err := a.devSvc.ListDevices(ctx)
	if err != nil {
		return "", err
	}

	a.mu.Lock()
	activeSerial := a.activeSerial
	a.mu.Unlock()

	for _, d := range devices {
		if d.Serial == activeSerial && d.Mode == device.ModeFastboot {
			return activeSerial, nil
		}
	}

	for _, d := range devices {
		if d.Mode == device.ModeFastboot {
			a.mu.Lock()
			a.activeSerial = d.Serial
			a.mu.Unlock()
			return d.Serial, nil
		}
	}

	return "", core.NewOperationError(
		"resolve_fastboot_serial",
		"No Fastboot device is available",
		"no connected Fastboot device found",
		true,
	)
}

func (a *App) currentConfig() *core.AppConfig {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.cfg
}

func appDataDir() (string, error) {
	return core.ResolveDataDir()
}
