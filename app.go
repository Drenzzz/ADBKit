package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"sync"
)

type App struct {
	ctx             context.Context
	auditLog        *AuditLog
	binaryService   *BinaryService
	deviceService   *DeviceService
	wirelessService *WirelessService
	monitorService  *MonitorService
	packageService  *PackageService
	fileService     *FileService
	dialogService   *DialogService
	terminalService *TerminalService
	logcatService   *LogcatService
	config          *AppConfig
	dataDir         string
	activeSerial    string
	mu              sync.Mutex
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
	a.deviceService = NewDeviceService(a.dataDir)
	a.wirelessService = NewWirelessService(a.dataDir)
	a.monitorService = NewMonitorService(a.dataDir)
	a.dialogService = NewDialogService(ctx)
	a.packageService = NewPackageService(a.resolveActiveSerial, a.dialogService.SelectSaveFile)
	a.fileService = NewFileService(ctx, a.resolveActiveSerial)
	a.terminalService = NewTerminalService(ctx, a.binaryService, a.currentConfig, a.resolveActiveSerial)
	a.logcatService = NewLogcatService(ctx, a.binaryService, a.currentConfig)

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

func (a *App) shutdown(ctx context.Context) {
	a.logcatService.Shutdown()
	a.terminalService.Shutdown()
}

func (a *App) StartTerminal(serial string) (*TerminalSession, error) {
	return a.terminalService.StartSession(a.ctx, serial)
}

func (a *App) StartTerminalSession(mode string, serial string, initialArgs string) (*TerminalSession, error) {
	return a.terminalService.StartSessionWithMode(a.ctx, mode, serial, initialArgs)
}

func (a *App) SendTerminalInput(sessionID string, input string) error {
	return a.terminalService.SendInput(sessionID, input)
}

func (a *App) CloseTerminal(sessionID string) error {
	return a.terminalService.CloseSession(sessionID)
}

func (a *App) StartLogcat(serial string, levels string, tagFilter string) error {
	return a.logcatService.StartStream(a.ctx, serial, levels, tagFilter)
}

func (a *App) StopLogcat(serial string) error {
	return a.logcatService.StopStream(serial)
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

func (a *App) SelectBinaryFile(name string) (string, error) {
	return a.dialogService.SelectBinaryFile(name)
}

func (a *App) SelectPlatformToolsDirectory() (*PlatformToolsSelection, error) {
	return a.dialogService.SelectPlatformToolsDirectory()
}

func (a *App) GetDevices() ([]DeviceSummary, error) {
	return a.deviceService.ListDevices(a.ctx)
}

func (a *App) GetActiveSerial() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.activeSerial
}

func (a *App) SetActiveSerial(serial string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	devices, err := a.deviceService.ListDevices(a.ctx)
	if err != nil {
		return err
	}

	for _, device := range devices {
		if device.Serial == serial {
			a.activeSerial = serial
			return nil
		}
	}

	return NewOperationError("set_active_serial", "device not found", fmt.Sprintf("serial '%s' is not connected", serial), true)
}

func (a *App) GetDeviceInfo(serial string) (*DeviceInfo, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.deviceService.GetDeviceInfo(a.ctx, resolved)
}

func (a *App) GetDeviceMode(serial string) (DeviceMode, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.deviceService.DetectDeviceMode(a.ctx, resolved)
}

func (a *App) RebootDevice(serial string, mode string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.deviceService.RebootDevice(a.ctx, resolved, mode)
}

func (a *App) ConnectWireless(address string) (string, error) {
	return a.wirelessService.Connect(a.ctx, address)
}

func (a *App) EnableWirelessTCPIP(port string, serial string) (string, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.wirelessService.EnableTCPIP(a.ctx, resolved, port)
}

func (a *App) DisconnectWireless(address string) (string, error) {
	return a.wirelessService.Disconnect(a.ctx, address)
}

func (a *App) GetPerformanceSnapshot(serial string) (PerformanceSnapshot, error) {
	resolved := serial
	if resolved == "" {
		a.mu.Lock()
		resolved = a.activeSerial
		a.mu.Unlock()
	}
	return a.monitorService.GetSnapshot(a.ctx, resolved)
}

func (a *App) GetDeviceNicknames() map[string]string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.config.DeviceNicknames
}

func (a *App) SetDeviceNickname(serial string, nickname string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.config.DeviceNicknames[serial] = nickname
	return SaveConfig(a.dataDir, a.config)
}

func (a *App) ClearDeviceNickname(serial string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	delete(a.config.DeviceNicknames, serial)
	return SaveConfig(a.dataDir, a.config)
}

func (a *App) resolveActiveSerial(ctx context.Context) (string, error) {
	a.mu.Lock()
	serial := a.activeSerial
	a.mu.Unlock()

	if serial != "" {
		return serial, nil
	}

	devices, err := a.deviceService.ListDevices(ctx)
	if err != nil {
		return "", err
	}

	for _, d := range devices {
		if d.Mode == DeviceModeADB && d.State == DeviceStateReady {
			a.mu.Lock()
			a.activeSerial = d.Serial
			a.mu.Unlock()
			return d.Serial, nil
		}
	}

	return "", NewOperationError("resolve_active_serial", "No active device is available", "no ready ADB device found", true)
}

func (a *App) currentConfig() *AppConfig {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.config
}

func (a *App) ListPackages(filterType string) ([]PackageInfo, error) {
	return a.packageService.ListPackages(a.ctx, filterType)
}

func (a *App) InstallPackage(filePath string) (string, error) {
	return a.packageService.InstallPackage(a.ctx, filePath)
}

func (a *App) UninstallPackage(packageName string) (string, error) {
	return a.packageService.UninstallPackage(a.ctx, packageName)
}

func (a *App) UninstallMultiplePackages(packageNames []string) (string, error) {
	return a.packageService.UninstallMultiplePackages(a.ctx, packageNames)
}

func (a *App) EnablePackage(packageName string) (string, error) {
	return a.packageService.EnablePackage(a.ctx, packageName)
}

func (a *App) EnableMultiplePackages(packageNames []string) (string, error) {
	return a.packageService.EnableMultiplePackages(a.ctx, packageNames)
}

func (a *App) DisablePackage(packageName string) (string, error) {
	return a.packageService.DisablePackage(a.ctx, packageName)
}

func (a *App) DisableMultiplePackages(packageNames []string) (string, error) {
	return a.packageService.DisableMultiplePackages(a.ctx, packageNames)
}

func (a *App) ClearPackageData(packageName string) (string, error) {
	return a.packageService.ClearPackageData(a.ctx, packageName)
}

func (a *App) PullPackageApk(packageName string) (string, error) {
	return a.packageService.PullPackageApk(a.ctx, packageName)
}

func (a *App) LaunchPackage(packageName string) (string, error) {
	return a.packageService.LaunchPackage(a.ctx, packageName)
}

func (a *App) ForceStopPackage(packageName string) (string, error) {
	return a.packageService.ForceStopPackage(a.ctx, packageName)
}

func (a *App) GetPackageDetails(packageName string) (PackageDetails, error) {
	return a.packageService.GetPackageDetails(a.ctx, packageName)
}

func (a *App) SelectApkFile() (string, error) {
	return a.dialogService.SelectApkFile()
}

func (a *App) ListFiles(remotePath string, showHidden bool) ([]FileEntry, error) {
	return a.fileService.ListFiles(a.ctx, remotePath, showHidden)
}

func (a *App) GetDirectorySize(remotePath string) (string, error) {
	return a.fileService.GetDirectorySize(a.ctx, remotePath)
}

func (a *App) GetStorageInfo() (StorageInfo, error) {
	return a.fileService.GetStorageInfo(a.ctx)
}

func (a *App) PullFile(remotePath string, localPath string) (string, error) {
	return a.fileService.PullFile(a.ctx, remotePath, localPath)
}

func (a *App) PullMultipleFiles(remotePaths []string, localDirectory string) (string, error) {
	return a.fileService.PullMultipleFiles(a.ctx, remotePaths, localDirectory)
}

func (a *App) PushFile(localPath string, remotePath string) (string, error) {
	return a.fileService.PushFile(a.ctx, localPath, remotePath)
}

func (a *App) PushMultipleFiles(localPaths []string, remoteDirectory string) (string, error) {
	return a.fileService.PushMultipleFiles(a.ctx, localPaths, remoteDirectory)
}

func (a *App) DeleteFile(remotePath string) (string, error) {
	return a.fileService.DeleteFile(a.ctx, remotePath)
}

func (a *App) DeleteMultipleFiles(remotePaths []string) (string, error) {
	return a.fileService.DeleteMultipleFiles(a.ctx, remotePaths)
}

func (a *App) CreateDirectory(remotePath string) (string, error) {
	return a.fileService.CreateDirectory(a.ctx, remotePath)
}

func (a *App) RenameFile(oldRemotePath string, newRemotePath string) (string, error) {
	return a.fileService.RenameFile(a.ctx, oldRemotePath, newRemotePath)
}

func (a *App) SelectFile() (string, error) {
	return a.dialogService.SelectFile()
}

func (a *App) SelectDirectory() (string, error) {
	return a.dialogService.SelectDirectory()
}

func (a *App) SelectMultipleFiles() ([]string, error) {
	return a.dialogService.SelectMultipleFiles()
}
