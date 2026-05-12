package main

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	BinaryNameAdb      = "adb"
	BinaryNameFastboot = "fastboot"
	BinaryNameScrcpy   = "scrcpy"
)

type BinaryStatus string

const (
	BinaryFound       BinaryStatus = "found"
	BinaryMissing     BinaryStatus = "missing"
	BinaryInvalid     BinaryStatus = "invalid_path"
	BinaryDownloading BinaryStatus = "downloading"
	BinaryReady       BinaryStatus = "ready"
)

type BinaryInfo struct {
	Name    string       `json:"name"`
	Path    string       `json:"path"`
	Source  string       `json:"source"`
	Status  BinaryStatus `json:"status"`
	Version string       `json:"version,omitempty"`
	Reason  string       `json:"reason,omitempty"`
}

type BinarySetupResult struct {
	Adb      *BinaryInfo `json:"adb"`
	Fastboot *BinaryInfo `json:"fastboot"`
	Scrcpy   *BinaryInfo `json:"scrcpy"`
	Ready    bool        `json:"ready"`
}

type SetupState struct {
	Status         *BinarySetupResult `json:"status"`
	SetupCompleted bool               `json:"setupCompleted"`
	CanFinish      bool               `json:"canFinish"`
}

type RevalidationResult struct {
	Status  *BinarySetupResult `json:"status"`
	Changed bool               `json:"changed"`
}

type BinaryService struct {
	dataDir string
}

func NewBinaryService(dataDir string) *BinaryService {
	return &BinaryService{dataDir: dataDir}
}

func (bs *BinaryService) DetectAll(cfg *AppConfig) []*BinaryInfo {
	results := make([]*BinaryInfo, 0, 3)
	results = append(results, bs.Detect(BinaryNameAdb, cfg.AdbPath))
	results = append(results, bs.Detect(BinaryNameFastboot, cfg.FastbootPath))
	results = append(results, bs.Detect(BinaryNameScrcpy, cfg.ScrcpyPath))
	return results
}

func (bs *BinaryService) GetBinaryStatus(cfg *AppConfig) *BinarySetupResult {
	adb := bs.Detect(BinaryNameAdb, cfg.AdbPath)
	fastboot := bs.Detect(BinaryNameFastboot, cfg.FastbootPath)
	scrcpy := bs.Detect(BinaryNameScrcpy, cfg.ScrcpyPath)

	return &BinarySetupResult{
		Adb:      adb,
		Fastboot: fastboot,
		Scrcpy:   scrcpy,
		Ready:    adb.Status == BinaryReady && fastboot.Status == BinaryReady && scrcpy.Status == BinaryReady,
	}
}

func (bs *BinaryService) GetSetupState(cfg *AppConfig) *SetupState {
	status := bs.GetBinaryStatus(cfg)
	return &SetupState{
		Status:         status,
		SetupCompleted: cfg.SetupCompleted && status.Ready,
		CanFinish:      status.Ready,
	}
}

func (bs *BinaryService) SetCustomBinary(cfg *AppConfig, name, path string) error {
	resolved := bs.resolveCandidate(name, path, "config", true)
	if resolved.Status != BinaryReady {
		return NewOperationError("set_custom_binary", "binary path is invalid", resolved.Reason, false)
	}
	assignBinaryPath(cfg, name, resolved.Path)
	cfg.BinaryVersions[name] = resolved.Version
	cfg.SetupCompleted = false
	return nil
}

func (bs *BinaryService) ClearCustomBinary(cfg *AppConfig, name string) error {
	if !IsSupportedBinaryName(name) {
		return NewOperationError("clear_custom_binary", "unsupported binary name", name, false)
	}
	assignBinaryPath(cfg, name, "")
	delete(cfg.BinaryVersions, name)
	cfg.SetupCompleted = false
	return nil
}

func (bs *BinaryService) CompleteSetup(cfg *AppConfig) (*SetupState, error) {
	state := bs.GetSetupState(cfg)
	if !state.CanFinish {
		return nil, NewOperationError("complete_setup", "required binaries are not ready", "adb, fastboot, and scrcpy must be ready", false)
	}
	cfg.SetupCompleted = true
	return bs.GetSetupState(cfg), nil
}

func (bs *BinaryService) RevalidateConfig(cfg *AppConfig) *RevalidationResult {
	status := bs.GetBinaryStatus(cfg)
	changed := false
	changed = syncBinaryConfig(cfg, BinaryNameAdb, status.Adb) || changed
	changed = syncBinaryConfig(cfg, BinaryNameFastboot, status.Fastboot) || changed
	changed = syncBinaryConfig(cfg, BinaryNameScrcpy, status.Scrcpy) || changed
	if cfg.SetupCompleted && !status.Ready {
		cfg.SetupCompleted = false
		changed = true
	}
	if changed {
		status = bs.GetBinaryStatus(cfg)
	}
	return &RevalidationResult{Status: status, Changed: changed}
}

func (bs *BinaryService) GetManagedBinaryDir() string {
	return filepath.Join(bs.dataDir, "bin")
}

func (bs *BinaryService) ListManagedBinaries() ([]string, error) {
	dir := bs.GetManagedBinaryDir()
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, NewOperationError("list_managed_binaries", "failed to prepare managed binary directory", err.Error(), true)
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, NewOperationError("list_managed_binaries", "failed to read managed binary directory", err.Error(), true)
	}
	binaries := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() {
			binaries = append(binaries, entry.Name())
		}
	}
	return binaries, nil
}

func (bs *BinaryService) Detect(name string, configPath string) *BinaryInfo {
	info := &BinaryInfo{Name: name, Status: BinaryMissing}
	if !IsSupportedBinaryName(name) {
		info.Status = BinaryInvalid
		info.Reason = "unsupported binary name"
		return info
	}

	if configPath != "" {
		resolved := bs.resolveCandidate(name, configPath, "config", true)
		if resolved.Status == BinaryReady {
			return resolved
		}
		info = resolved
	}

	if path, err := exec.LookPath(binaryExecutableName(name)); err == nil {
		resolved := bs.resolveCandidate(name, path, "system-path", false)
		if resolved.Status == BinaryReady {
			return resolved
		}
	}

	managedPath := filepath.Join(bs.dataDir, "bin", binaryExecutableName(name))
	resolved := bs.resolveCandidate(name, managedPath, "app-data", false)
	if resolved.Status == BinaryReady {
		return resolved
	}

	for _, candidate := range bs.commonPaths(name) {
		resolved := bs.resolveCandidate(name, candidate, "common-path", false)
		if resolved.Status == BinaryReady {
			return resolved
		}
	}

	return info
}

func (bs *BinaryService) resolveCandidate(name, path, source string, explicit bool) *BinaryInfo {
	info := &BinaryInfo{Name: name, Path: path, Source: source, Status: BinaryMissing}
	if err := ValidateBinaryExecutable(name, path); err != nil {
		if explicit {
			info.Status = BinaryInvalid
			info.Reason = err.Error()
		}
		return info
	}
	version, err := bs.getVersion(name, path)
	if err != nil {
		info.Status = BinaryInvalid
		info.Reason = err.Error()
		return info
	}
	info.Status = BinaryReady
	info.Version = version
	return info
}

func IsSupportedBinaryName(name string) bool {
	switch name {
	case BinaryNameAdb, BinaryNameFastboot, BinaryNameScrcpy:
		return true
	default:
		return false
	}
}

func binaryExecutableName(name string) string {
	if runtime.GOOS == "windows" {
		return name + ".exe"
	}
	return name
}

func (bs *BinaryService) getVersion(name, path string) (string, error) {
	var lastErr error
	for _, args := range versionCommands(name) {
		ctx := context.Background()
		result, err := RunCommand(ctx, ExecRequest{
			Command: path,
			Args:    args,
			Timeout: 5 * time.Second,
		})
		if err != nil {
			lastErr = err
			continue
		}
		if result.ExitCode != 0 {
			lastErr = errors.New(strings.TrimSpace(result.Stderr))
			continue
		}
		version := parseVersion(result.Stdout)
		if version == "" {
			version = parseVersion(result.Stderr)
		}
		if version != "" {
			return version, nil
		}
		lastErr = errors.New("version output is empty")
	}
	if lastErr != nil {
		return "", lastErr
	}
	return "", errors.New("version command is unavailable")
}

func versionCommands(name string) [][]string {
	switch name {
	case BinaryNameAdb:
		return [][]string{{"version"}}
	case BinaryNameFastboot:
		return [][]string{{"--version"}, {"version"}}
	case BinaryNameScrcpy:
		return [][]string{{"--version"}}
	default:
		return [][]string{{"--version"}}
	}
}

func parseVersion(output string) string {
	for _, line := range strings.Split(output, "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			return line
		}
	}
	return ""
}

func (bs *BinaryService) commonPaths(name string) []string {
	home, _ := os.UserHomeDir()
	executable := binaryExecutableName(name)

	switch runtime.GOOS {
	case "linux":
		return []string{
			filepath.Join(home, "Android", "Sdk", "platform-tools", executable),
			filepath.Join("/usr", "bin", executable),
			filepath.Join("/usr", "local", "bin", executable),
		}
	case "darwin":
		return []string{
			filepath.Join(home, "Library", "Android", "sdk", "platform-tools", executable),
			filepath.Join("/usr", "local", "bin", executable),
			filepath.Join("/opt", "homebrew", "bin", executable),
		}
	case "windows":
		appData := os.Getenv("APPDATA")
		return []string{
			filepath.Join(home, "AppData", "Local", "Android", "Sdk", "platform-tools", executable),
			filepath.Join(appData, "adbkit", "bin", executable),
		}
	default:
		return nil
	}
}

func assignBinaryPath(cfg *AppConfig, name, path string) {
	switch name {
	case BinaryNameAdb:
		cfg.AdbPath = path
	case BinaryNameFastboot:
		cfg.FastbootPath = path
	case BinaryNameScrcpy:
		cfg.ScrcpyPath = path
		cfg.ScrcpyEnabled = true
	}
}

func syncBinaryConfig(cfg *AppConfig, name string, info *BinaryInfo) bool {
	if info == nil || info.Status != BinaryReady {
		return false
	}
	changed := false
	if pathChanged(cfg, name, info.Path) {
		assignBinaryPath(cfg, name, info.Path)
		changed = true
	}
	if cfg.BinaryVersions == nil {
		cfg.BinaryVersions = make(map[string]string)
		changed = true
	}
	if cfg.BinaryVersions[name] != info.Version {
		cfg.BinaryVersions[name] = info.Version
		changed = true
	}
	return changed
}

func pathChanged(cfg *AppConfig, name, path string) bool {
	switch name {
	case BinaryNameAdb:
		return cfg.AdbPath != path
	case BinaryNameFastboot:
		return cfg.FastbootPath != path
	case BinaryNameScrcpy:
		return cfg.ScrcpyPath != path
	default:
		return false
	}
}
