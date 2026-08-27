package binary

import (
	"ADBKit/internal/core"
)

const (
	BinaryNameAdb      = core.BinaryNameAdb
	BinaryNameFastboot = core.BinaryNameFastboot
	BinaryNameScrcpy   = core.BinaryNameScrcpy
)

type Status = core.BinaryStatus

const (
	BinaryMissing = core.BinaryMissing
	BinaryInvalid = core.BinaryInvalid
	BinaryReady   = core.BinaryReady
)

type BinaryInfo = core.BinaryInfo

type BinarySetupResult struct {
	Adb              *BinaryInfo  `json:"adb"`
	Fastboot         *BinaryInfo  `json:"fastboot"`
	Scrcpy           *BinaryInfo  `json:"scrcpy"`
	Ready            bool         `json:"ready"`
	AdbCandidates    []BinaryInfo `json:"adbCandidates"`
	FastbootCandidates []BinaryInfo `json:"fastbootCandidates"`
	ScrcpyCandidates   []BinaryInfo `json:"scrcpyCandidates"`
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

type Service struct {
	dataDir             string
	commonPathsOverride func(string) []string
}

func NewService(dataDir string) *Service {
	return &Service{dataDir: dataDir}
}

func (bs *Service) DetectAll(cfg *core.AppConfig) []*BinaryInfo {
	results := make([]*BinaryInfo, 0, 3)
	results = append(results, bs.Detect(BinaryNameAdb, cfg.AdbPath))
	results = append(results, bs.Detect(BinaryNameFastboot, cfg.FastbootPath))
	results = append(results, bs.Detect(BinaryNameScrcpy, cfg.ScrcpyPath))
	return results
}

func (bs *Service) GetBinaryStatus(cfg *core.AppConfig) *BinarySetupResult {
	adb := bs.Detect(BinaryNameAdb, cfg.AdbPath)
	fastboot := bs.Detect(BinaryNameFastboot, cfg.FastbootPath)
	scrcpy := bs.Detect(BinaryNameScrcpy, cfg.ScrcpyPath)

	return &BinarySetupResult{
		Adb:                adb,
		Fastboot:           fastboot,
		Scrcpy:             scrcpy,
		Ready:              adb.Status == BinaryReady && fastboot.Status == BinaryReady && scrcpy.Status == BinaryReady,
		AdbCandidates:      bs.DetectAllCandidates(BinaryNameAdb, cfg.AdbPath),
		FastbootCandidates: bs.DetectAllCandidates(BinaryNameFastboot, cfg.FastbootPath),
		ScrcpyCandidates:   bs.DetectAllCandidates(BinaryNameScrcpy, cfg.ScrcpyPath),
	}
}

func (bs *Service) GetSetupState(cfg *core.AppConfig) *SetupState {
	status := bs.GetBinaryStatus(cfg)
	return &SetupState{
		Status:         status,
		SetupCompleted: cfg.SetupCompleted && status.Ready,
		CanFinish:      status.Ready,
	}
}

func (bs *Service) SetCustomBinary(cfg *core.AppConfig, name, path string) error {
	resolved := bs.resolveCandidate(name, path, "config", true)
	if resolved.Status != BinaryReady {
		return core.NewOperationError("set_custom_binary", "binary path is invalid", resolved.Reason, false)
	}
	assignBinaryPath(cfg, name, resolved.Path)
	cfg.BinaryVersions[name] = resolved.Version
	cfg.SetupCompleted = false
	return nil
}

func (bs *Service) ClearCustomBinary(cfg *core.AppConfig, name string) error {
	if !core.IsSupportedBinaryName(name) {
		return core.NewOperationError("clear_custom_binary", "unsupported binary name", name, false)
	}
	assignBinaryPath(cfg, name, "")
	delete(cfg.BinaryVersions, name)
	cfg.SetupCompleted = false
	return nil
}

func (bs *Service) CompleteSetup(cfg *core.AppConfig) (*SetupState, error) {
	state := bs.GetSetupState(cfg)
	if !state.CanFinish {
		return nil, core.NewOperationError("complete_setup", "required binaries are not ready", "adb, fastboot, and scrcpy must be ready", false)
	}
	// Persist detected binary paths so they survive app restart
	syncBinaryConfig(cfg, BinaryNameAdb, state.Status.Adb)
	syncBinaryConfig(cfg, BinaryNameFastboot, state.Status.Fastboot)
	syncBinaryConfig(cfg, BinaryNameScrcpy, state.Status.Scrcpy)
	cfg.SetupCompleted = true
	return bs.GetSetupState(cfg), nil
}

func (bs *Service) RevalidateConfig(cfg *core.AppConfig) *RevalidationResult {
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

func (bs *Service) GetManagedBinaryDir() string {
	return joinManaged(bs.dataDir)
}

func (bs *Service) ListManagedBinaries() ([]string, error) {
	dir := bs.GetManagedBinaryDir()
	if err := osMkdirAll(dir); err != nil {
		return nil, core.NewOperationError("list_managed_binaries", "failed to prepare managed binary directory", err.Error(), true)
	}
	entries, err := osReadDir(dir)
	if err != nil {
		return nil, core.NewOperationError("list_managed_binaries", "failed to read managed binary directory", err.Error(), true)
	}
	binaries := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() {
			binaries = append(binaries, entry.Name())
		}
	}
	return binaries, nil
}

func assignBinaryPath(cfg *core.AppConfig, name, path string) {
	switch name {
	case BinaryNameAdb:
		cfg.AdbPath = path
	case BinaryNameFastboot:
		cfg.FastbootPath = path
	case BinaryNameScrcpy:
		cfg.ScrcpyPath = path
	}
}

func syncBinaryConfig(cfg *core.AppConfig, name string, info *BinaryInfo) bool {
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

func pathChanged(cfg *core.AppConfig, name, path string) bool {
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
