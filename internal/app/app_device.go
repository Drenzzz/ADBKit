package app

import (
	"ADBKit/internal/core"
	"ADBKit/internal/device"
	"fmt"
	"net"
	"strings"
)

func (a *App) GetDevices() ([]device.Summary, error) {
	return a.devSvc.ListDevices(a.ctx)
}

func (a *App) GetActiveSerial() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.activeSerial
}

func (a *App) SetActiveSerial(serial string) error {
	return auditVoidAction(a, "set_active_serial", func() error {
		a.mu.Lock()
		defer a.mu.Unlock()

		devices, err := a.devSvc.ListDevices(a.ctx)
		if err != nil {
			return err
		}

		for _, d := range devices {
			if d.Serial == serial {
				a.activeSerial = serial
				return nil
			}
		}

		return core.NewOperationError("set_active_serial", "device not found", fmt.Sprintf("serial '%s' is not connected", serial), true)
	})
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
	return auditAction(a, "reboot_device", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.devSvc.RebootDevice(a.ctx, resolved, mode)
	})
}

func (a *App) ConnectWireless(address string) (string, error) {
	return auditAction(a, "connect_wireless", func() (string, error) {
		return a.wireSvc.Connect(a.ctx, address)
	})
}

func (a *App) EnableWirelessTCPIP(port string, serial string) (string, error) {
	return auditAction(a, "enable_wireless_tcpip", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.wireSvc.EnableTCPIP(a.ctx, resolved, port)
	})
}

func (a *App) DisconnectWireless(address string) (string, error) {
	return auditAction(a, "disconnect_wireless", func() (string, error) {
		return a.wireSvc.Disconnect(a.ctx, address)
	})
}

func (a *App) PairWireless(address string, code string) (string, error) {
	return auditAction(a, "pair_wireless", func() (string, error) {
		return a.wireSvc.Pair(a.ctx, address, code)
	})
}

func (a *App) GetWirelessHistory() []core.WirelessHistoryEntry {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cfg == nil {
		return []core.WirelessHistoryEntry{}
	}
	return cloneWirelessHistory(a.cfg.WirelessHistory)
}

func (a *App) SaveWirelessHistory(entries []core.WirelessHistoryEntry) error {
	return auditVoidAction(a, "save_wireless_history", func() error {
		normalized := make([]core.WirelessHistoryEntry, 0, len(entries))
		seen := make(map[string]struct{}, len(entries))
		for _, entry := range entries {
			address := strings.TrimSpace(entry.Address)
			if _, _, err := net.SplitHostPort(address); err != nil {
				return core.NewOperationError("save_wireless_history", "wireless address is invalid", address, false)
			}
			key := strings.ToLower(address)
			if _, exists := seen[key]; exists {
				continue
			}
			seen[key] = struct{}{}
			name := strings.TrimSpace(entry.Name)
			if name == "" {
				name = address
			}
			normalized = append(normalized, core.WirelessHistoryEntry{Address: address, Name: name})
		}

		a.mu.Lock()
		defer a.mu.Unlock()
		if a.cfg == nil {
			return core.NewOperationError("save_wireless_history", "app config is not available", "", false)
		}
		a.cfg.WirelessHistory = normalized
		return core.SaveConfig(a.dataDir, a.cfg)
	})
}

func cloneWirelessHistory(input []core.WirelessHistoryEntry) []core.WirelessHistoryEntry {
	if input == nil {
		return []core.WirelessHistoryEntry{}
	}
	out := make([]core.WirelessHistoryEntry, len(input))
	copy(out, input)
	return out
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
	return auditVoidAction(a, "set_device_nickname", func() error {
		a.mu.Lock()
		a.cfg.DeviceNicknames[serial] = nickname
		a.mu.Unlock()
		return core.SaveConfig(a.dataDir, a.cfg)
	})
}

func (a *App) ClearDeviceNickname(serial string) error {
	return auditVoidAction(a, "clear_device_nickname", func() error {
		a.mu.Lock()
		delete(a.cfg.DeviceNicknames, serial)
		a.mu.Unlock()
		return core.SaveConfig(a.dataDir, a.cfg)
	})
}
