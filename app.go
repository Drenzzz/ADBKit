package main

import (
	"ADBKit/internal/audit"
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"ADBKit/internal/device"
	"ADBKit/internal/dialog"
	"ADBKit/internal/file"
	"ADBKit/internal/flasher"
	packagemgr "ADBKit/internal/package_mgr"
	"ADBKit/internal/scrcpy"
	"ADBKit/internal/shell"
	"context"
	"fmt"
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

	binSvc     *binary.Service
	devSvc     *device.Service
	wireSvc    *device.WirelessService
	monSvc     *device.MonitorService
	diaSvc     *dialog.Service
	pkgSvc     *packagemgr.Service
	fileSvc    *file.Service
	termSvc    *shell.TerminalService
	logSvc     *shell.LogcatService
	fbSvc      *flasher.FastbootService
	fpSvc      *flasher.PlanService
	scrSvc     *scrcpy.Service
	auditLog   *audit.Log
	cfg        *core.AppConfig
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
	a.binSvc = binary.NewService(a.dataDir)
	a.devSvc = device.NewService(a.dataDir)
	a.wireSvc = device.NewWirelessService(a.dataDir)
	a.monSvc = device.NewMonitorService(a.dataDir)
	a.diaSvc = dialog.New(ctx)
	a.pkgSvc = packagemgr.NewService(a.resolveActiveSerial, a.diaSvc.SelectSaveFile)
	a.fileSvc = file.NewService(ctx, a.resolveActiveSerial)
	a.termSvc = shell.NewTerminalService(ctx, a.binSvc, a.currentConfig, a.resolveActiveSerial)
	a.logSvc = shell.NewLogcatService(ctx, a.binSvc, a.currentConfig)
	a.fbSvc = flasher.NewFastbootService(a.currentConfig, a.resolveActiveSerial)
	a.fpSvc = flasher.NewPlanService(a.fbSvc)
	a.scrSvc = scrcpy.New(a.ctx, a.binSvc, a.currentConfig, a.resolveActiveSerial, a.diaSvc, a.auditLog)

	al, err := audit.New(a.dataDir)
	if err != nil {
		log.Printf("failed to init audit log: %v", err)
	}
	a.auditLog = al
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

func (a *App) Greet(name string) string {
	return "Hello " + name + ", It's show time!"
}

func (a *App) StartTerminal(serial string) (*shell.Session, error) {
	return a.termSvc.StartSession(a.ctx, serial)
}

func (a *App) StartTerminalSession(mode string, serial string, initialArgs string) (*shell.Session, error) {
	return a.termSvc.StartSessionWithMode(a.ctx, mode, serial, initialArgs)
}

func (a *App) SendTerminalInput(sessionID string, input string) error {
	return a.termSvc.SendInput(sessionID, input)
}

func (a *App) CloseTerminal(sessionID string) error {
	return a.termSvc.CloseSession(sessionID)
}

func (a *App) StartLogcat(serial string, levels string, tagFilter string) error {
	return a.logSvc.StartStream(a.ctx, serial, levels, tagFilter)
}

func (a *App) StopLogcat(serial string) error {
	return a.logSvc.StopStream(serial)
}

func (a *App) SaveLogcatToFile(content string, defaultFilename string) error {
	path, err := a.diaSvc.SelectSaveFile(defaultFilename)
	if err != nil {
		return err
	}
	if path == "" {
		return nil
	}
	return os.WriteFile(path, []byte(content), 0o600)
}

func (a *App) GetBinaryStatus() *binary.BinarySetupResult {
	return a.binSvc.GetBinaryStatus(a.cfg)
}

func (a *App) GetSetupState() *binary.SetupState {
	return a.binSvc.GetSetupState(a.cfg)
}

func (a *App) RetryBinaryDetection() (*binary.BinarySetupResult, error) {
	a.mu.Lock()
	result := a.binSvc.RevalidateConfig(a.cfg)
	a.mu.Unlock()
	if result.Changed {
		if err := core.SaveConfig(a.dataDir, a.cfg); err != nil {
			return nil, err
		}
	}
	return result.Status, nil
}

func (a *App) SetCustomBinary(name string, path string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if err := a.binSvc.SetCustomBinary(a.cfg, name, path); err != nil {
		return err
	}
	return core.SaveConfig(a.dataDir, a.cfg)
}

func (a *App) ClearCustomBinary(name string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if err := a.binSvc.ClearCustomBinary(a.cfg, name); err != nil {
		return err
	}
	return core.SaveConfig(a.dataDir, a.cfg)
}

func (a *App) CompleteSetup() (*binary.SetupState, error) {
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

func (a *App) GetDevices() ([]device.Summary, error) {
	return a.devSvc.ListDevices(a.ctx)
}

func (a *App) GetActiveSerial() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.activeSerial
}

func (a *App) SetActiveSerial(serial string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	devices, err := a.devSvc.ListDevices(a.ctx)
	if err != nil {
		return err
	}

	for _, device := range devices {
		if device.Serial == serial {
			a.activeSerial = serial
			return nil
		}
	}

	return core.NewOperationError("set_active_serial", "device not found", fmt.Sprintf("serial '%s' is not connected", serial), true)
}

func (a *App) GetDeviceInfo(serial string) (*device.Info, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.devSvc.GetDeviceInfo(a.ctx, resolved)
}

func (a *App) GetDeviceMode(serial string) (device.Mode, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.devSvc.DetectDeviceMode(a.ctx, resolved)
}

func (a *App) RebootDevice(serial string, mode string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.devSvc.RebootDevice(a.ctx, resolved, mode)
}

func (a *App) ConnectWireless(address string) (string, error) {
	return a.wireSvc.Connect(a.ctx, address)
}

func (a *App) EnableWirelessTCPIP(port string, serial string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.wireSvc.EnableTCPIP(a.ctx, resolved, port)
}

func (a *App) DisconnectWireless(address string) (string, error) {
	return a.wireSvc.Disconnect(a.ctx, address)
}

func (a *App) GetPerformanceSnapshot(serial string) (device.PerformanceSnapshot, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.monSvc.GetSnapshot(a.ctx, resolved)
}

func (a *App) GetDeviceNicknames() map[string]string {
	return a.cfg.DeviceNicknames
}

func (a *App) SetDeviceNickname(serial string, nickname string) error {
	a.mu.Lock()
	a.cfg.DeviceNicknames[serial] = nickname
	a.mu.Unlock()
	return core.SaveConfig(a.dataDir, a.cfg)
}

func (a *App) ClearDeviceNickname(serial string) error {
	a.mu.Lock()
	delete(a.cfg.DeviceNicknames, serial)
	a.mu.Unlock()
	return core.SaveConfig(a.dataDir, a.cfg)
}

func (a *App) ListPackages(filterType string) ([]packagemgr.Info, error) {
	return a.pkgSvc.ListPackages(a.ctx, filterType)
}

func (a *App) InstallPackage(filePath string) (string, error) {
	return a.pkgSvc.InstallPackage(a.ctx, filePath)
}

func (a *App) UninstallPackage(packageName string) (string, error) {
	return a.pkgSvc.UninstallPackage(a.ctx, packageName)
}

func (a *App) UninstallMultiplePackages(packageNames []string) (string, error) {
	return a.pkgSvc.UninstallMultiplePackages(a.ctx, packageNames)
}

func (a *App) EnablePackage(packageName string) (string, error) {
	return a.pkgSvc.EnablePackage(a.ctx, packageName)
}

func (a *App) EnableMultiplePackages(packageNames []string) (string, error) {
	return a.pkgSvc.EnableMultiplePackages(a.ctx, packageNames)
}

func (a *App) DisablePackage(packageName string) (string, error) {
	return a.pkgSvc.DisablePackage(a.ctx, packageName)
}

func (a *App) DisableMultiplePackages(packageNames []string) (string, error) {
	return a.pkgSvc.DisableMultiplePackages(a.ctx, packageNames)
}

func (a *App) ClearPackageData(packageName string) (string, error) {
	return a.pkgSvc.ClearPackageData(a.ctx, packageName)
}

func (a *App) PullPackageApk(packageName string) (string, error) {
	return a.pkgSvc.PullPackageApk(a.ctx, packageName)
}

func (a *App) LaunchPackage(packageName string) (string, error) {
	return a.pkgSvc.LaunchPackage(a.ctx, packageName)
}

func (a *App) ForceStopPackage(packageName string) (string, error) {
	return a.pkgSvc.ForceStopPackage(a.ctx, packageName)
}

func (a *App) GetPackageDetails(packageName string) (packagemgr.Details, error) {
	return a.pkgSvc.GetPackageDetails(a.ctx, packageName)
}

func (a *App) SelectApkFile() (string, error) {
	return a.diaSvc.SelectApkFile()
}

func (a *App) ListFiles(remotePath string, showHidden bool) ([]file.Entry, error) {
	return a.fileSvc.ListFiles(a.ctx, remotePath, showHidden)
}

func (a *App) GetDirectorySize(remotePath string) (string, error) {
	return a.fileSvc.GetDirectorySize(a.ctx, remotePath)
}

func (a *App) GetStorageInfo() (file.StorageInfo, error) {
	return a.fileSvc.GetStorageInfo(a.ctx)
}

func (a *App) PullFile(remotePath string, localPath string) (string, error) {
	return a.fileSvc.PullFile(a.ctx, remotePath, localPath)
}

func (a *App) PullMultipleFiles(remotePaths []string, localDirectory string) (string, error) {
	return a.fileSvc.PullMultipleFiles(a.ctx, remotePaths, localDirectory)
}

func (a *App) PushFile(localPath string, remotePath string) (string, error) {
	return a.fileSvc.PushFile(a.ctx, localPath, remotePath)
}

func (a *App) PushMultipleFiles(localPaths []string, remoteDirectory string) (string, error) {
	return a.fileSvc.PushMultipleFiles(a.ctx, localPaths, remoteDirectory)
}

func (a *App) DeleteFile(remotePath string) (string, error) {
	return a.fileSvc.DeleteFile(a.ctx, remotePath)
}

func (a *App) DeleteMultipleFiles(remotePaths []string) (string, error) {
	return a.fileSvc.DeleteMultipleFiles(a.ctx, remotePaths)
}

func (a *App) CreateDirectory(remotePath string) (string, error) {
	return a.fileSvc.CreateDirectory(a.ctx, remotePath)
}

func (a *App) RenameFile(oldRemotePath string, newRemotePath string) (string, error) {
	return a.fileSvc.RenameFile(a.ctx, oldRemotePath, newRemotePath)
}

func (a *App) SelectFile() (string, error) {
	return a.diaSvc.SelectFile()
}

func (a *App) SelectDirectory() (string, error) {
	return a.diaSvc.SelectDirectory()
}

func (a *App) SelectMultipleFiles() ([]string, error) {
	return a.diaSvc.SelectMultipleFiles()
}

func (a *App) SelectFlashImageFile() (string, error) {
	return a.diaSvc.SelectFlashImageFile()
}

func (a *App) SelectSideloadFile() (string, error) {
	return a.diaSvc.SelectSideloadFile()
}

func (a *App) GetFastbootDevices() ([]flasher.FastbootDeviceInfo, error) {
	return a.fbSvc.ListDevices(a.ctx)
}

func (a *App) FlashPartition(serial string, partition string, filePath string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	if a.auditLog != nil {
		a.auditLog.Log(audit.Entry{Operation: "flash_partition", Command: fmt.Sprintf("partition=%s file=%s", partition, filePath)})
	}
	return a.fbSvc.FlashPartition(a.ctx, resolved, partition, filePath)
}

func (a *App) WipeData(serial string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	if a.auditLog != nil {
		a.auditLog.Log(audit.Entry{Operation: "wipe_data", Command: fmt.Sprintf("serial=%s", resolved)})
	}
	return a.fbSvc.WipeData(a.ctx, resolved)
}

func (a *App) GetActiveSlot(serial string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.fbSvc.GetActiveSlot(a.ctx, resolved)
}

func (a *App) SetActiveSlot(serial string, slot string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	if a.auditLog != nil {
		a.auditLog.Log(audit.Entry{Operation: "set_active_slot", Command: fmt.Sprintf("serial=%s slot=%s", resolved, slot)})
	}
	return a.fbSvc.SetActiveSlot(a.ctx, resolved, slot)
}

func (a *App) RunCustomFastbootCommand(serial string, args string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	if a.auditLog != nil {
		a.auditLog.Log(audit.Entry{Operation: "run_fastboot_command", Command: args})
	}
	return a.fbSvc.RunCustomCommand(a.ctx, resolved, args)
}

func (a *App) SideloadPackage(serial string, zipPath string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	if a.auditLog != nil {
		a.auditLog.Log(audit.Entry{Operation: "sideload_package", Command: fmt.Sprintf("serial=%s zip=%s", resolved, zipPath)})
	}
	return a.fbSvc.SideloadPackage(a.ctx, resolved, zipPath)
}

func (a *App) IsUserspaceFastboot(serial string) (bool, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.fbSvc.IsUserspace(a.ctx, resolved)
}

func (a *App) ScanRomFolder(folderPath string) (*flasher.Plan, error) {
	return a.fpSvc.ScanRomFolder(folderPath)
}

func (a *App) FlashRomFolder(serial string, folderPath string, plan flasher.Plan) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.fpSvc.FlashRomFolder(a.ctx, resolved, folderPath, plan)
}

func (a *App) StartScrcpySession(serial string, opts scrcpy.Options) (*scrcpy.Session, error) {
	return a.scrSvc.StartSession(a.ctx, serial, opts)
}

func (a *App) StopScrcpySession(sessionID string) error {
	return a.scrSvc.StopSession(sessionID)
}

func (a *App) GetActiveScrcpySession() *scrcpy.Session {
	return a.scrSvc.GetActiveSession()
}

func (a *App) StartScrcpyRecording(serial string, outputPath string, opts scrcpy.Options) error {
	return a.scrSvc.StartRecording(serial, outputPath, opts)
}

func (a *App) StopScrcpyRecording() (string, error) {
	return a.scrSvc.StopRecording()
}

func (a *App) TakeScrcpyScreenshot(sessionID string, outputPath string) (string, error) {
	return a.scrSvc.TakeScreenshot(sessionID, outputPath)
}

func (a *App) GetScrcpyEncoderSupport(serial string) (*scrcpy.EncoderSupport, error) {
	return a.scrSvc.GetEncoderSupport(a.ctx, serial)
}

func (a *App) PushScrcpyClipboard(serial string, text string) error {
	return a.scrSvc.PushClipboard(serial, text)
}

func (a *App) GetScrcpyClipboard(serial string) (string, error) {
	return a.scrSvc.GetClipboard(serial)
}

func (a *App) SelectSavePath(defaultFilename string) (string, error) {
	return a.diaSvc.SelectSaveFile(defaultFilename)
}
