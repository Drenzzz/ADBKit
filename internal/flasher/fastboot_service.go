package flasher

import (
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"ADBKit/internal/device"
	"context"
	"fmt"
	"strings"
	"time"
)

const (
	FlashTimeout    = 20 * time.Minute
	SideloadTimeout = 45 * time.Minute
	WipeTimeout     = 10 * time.Minute
	GetvarTimeout   = 10 * time.Second
	CommandTimeout  = 5 * time.Minute
)

type FastbootDeviceInfo struct {
	Serial string       `json:"serial"`
	State  device.State `json:"state"`
	Mode   device.Mode  `json:"mode"`
}

type FastbootService struct {
	binaryService       *binary.Service
	getConfig           func() *core.AppConfig
	resolveActiveSerial func(context.Context) (string, error)
}

func NewFastbootService(
	binaryService *binary.Service,
	getConfig func() *core.AppConfig,
	resolveActiveSerial func(context.Context) (string, error),
) *FastbootService {
	return &FastbootService{
		binaryService:       binaryService,
		getConfig:           getConfig,
		resolveActiveSerial: resolveActiveSerial,
	}
}

// resolveBinaryPath memakai detection cascade yang sama dengan service lain
// (config path > system PATH > app-data > common paths), bukan hanya membaca
// config.FastbootPath. Ini memastikan fastboot yang hanya ada di PATH tetap
// terdeteksi seperti pada Dashboard.
func (s *FastbootService) resolveBinaryPath(name string) (string, error) {
	if s.binaryService == nil {
		return "", core.NewOperationError("resolve_fastboot_binary", "binary service is not available", "binary service is nil", false)
	}
	if s.getConfig == nil {
		return "", core.NewOperationError("resolve_fastboot_binary", "application config is unavailable", "config getter is nil", false)
	}

	status := s.binaryService.GetBinaryStatus(s.getConfig())
	var info *core.BinaryInfo
	switch name {
	case core.BinaryNameAdb:
		info = status.Adb
	case core.BinaryNameFastboot:
		info = status.Fastboot
	case core.BinaryNameScrcpy:
		info = status.Scrcpy
	}

	if info == nil || info.Status != core.BinaryReady || info.Path == "" {
		return "", core.NewOperationError("resolve_fastboot_binary", "required binary is not ready", fmt.Sprintf("binary '%s' is unavailable", name), true)
	}

	return info.Path, nil
}

func (s *FastbootService) requireSerial(ctx context.Context, serial string) (string, error) {
	trimmed := strings.TrimSpace(serial)
	if trimmed != "" {
		return trimmed, nil
	}
	if s.resolveActiveSerial == nil {
		return "", core.NewOperationError("resolve_active_serial", "device selection is unavailable", "resolver not configured", false)
	}
	resolved, err := s.resolveActiveSerial(ctx)
	if err != nil {
		return "", core.NewOperationError("resolve_active_serial", "no active device available", err.Error(), true)
	}
	trimmed = strings.TrimSpace(resolved)
	if trimmed == "" {
		return "", core.NewOperationError("resolve_active_serial", "no active device available", "resolved serial is empty", true)
	}
	return trimmed, nil
}
