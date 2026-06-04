package flasher

import (
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
	Serial string      `json:"serial"`
	State  device.State `json:"state"`
	Mode   device.Mode  `json:"mode"`
}

type binaryResolver interface {
	GetBinaryStatus(*core.AppConfig) *coreBinaryStatus
}

type coreBinaryStatus struct {
	Adb      *core.BinaryInfo
	Fastboot *core.BinaryInfo
	Scrcpy   *core.BinaryInfo
}

func (s coreBinaryStatus) GetAdb() *core.BinaryInfo     { return s.Adb }
func (s coreBinaryStatus) GetFastboot() *core.BinaryInfo { return s.Fastboot }
func (s coreBinaryStatus) GetScrcpy() *core.BinaryInfo   { return s.Scrcpy }

type FastbootService struct {
	getConfig           func() *core.AppConfig
	resolveActiveSerial func(context.Context) (string, error)
}

func NewFastbootService(
	getConfig func() *core.AppConfig,
	resolveActiveSerial func(context.Context) (string, error),
) *FastbootService {
	return &FastbootService{
		getConfig:           getConfig,
		resolveActiveSerial: resolveActiveSerial,
	}
}

func (s *FastbootService) resolveBinaryPath(name string) (string, error) {
	if s.getConfig == nil {
		return "", core.NewOperationError("resolve_fastboot_binary", "config getter is not configured", "", false)
	}
	status := s.getConfig()
	if status == nil {
		return "", core.NewOperationError("resolve_fastboot_binary", "config is not available", "", false)
	}
	var info *core.BinaryInfo
	switch name {
	case core.BinaryNameAdb:
		if status.AdbPath == "" {
			return "", core.NewOperationError("resolve_fastboot_binary", "binary is not configured", fmt.Sprintf("binary '%s' not set", name), true)
		}
		return status.AdbPath, nil
	case core.BinaryNameFastboot:
		if status.FastbootPath == "" {
			return "", core.NewOperationError("resolve_fastboot_binary", "binary is not configured", fmt.Sprintf("binary '%s' not set", name), true)
		}
		return status.FastbootPath, nil
	case core.BinaryNameScrcpy:
		if status.ScrcpyPath == "" {
			return "", core.NewOperationError("resolve_fastboot_binary", "binary is not configured", fmt.Sprintf("binary '%s' not set", name), true)
		}
		return status.ScrcpyPath, nil
	}
	if info == nil || info.Status != core.BinaryReady || info.Path == "" {
		return "", core.NewOperationError("resolve_fastboot_binary", "binary is not ready", fmt.Sprintf("binary '%s' unavailable", name), true)
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
