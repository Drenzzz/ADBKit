package app

import (
	"ADBKit/internal/core"
	"ADBKit/internal/device"
	"fmt"
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
