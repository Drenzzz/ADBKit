package main

import "ADBKit/internal/flasher"

func (a *App) GetFastbootDevices() ([]flasher.FastbootDeviceInfo, error) {
	return auditAction(a, "list_fastboot_devices", func() ([]flasher.FastbootDeviceInfo, error) {
		return a.fbSvc.ListDevices(a.ctx)
	})
}

func (a *App) FlashPartition(serial string, partition string, filePath string) (string, error) {
	return auditAction(a, "flash_partition", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.fbSvc.FlashPartition(a.ctx, resolved, partition, filePath)
	})
}

func (a *App) WipeData(serial string) (string, error) {
	return auditAction(a, "wipe_data", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.fbSvc.WipeData(a.ctx, resolved)
	})
}

func (a *App) GetActiveSlot(serial string) (string, error) {
	return auditAction(a, "get_active_slot", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.fbSvc.GetActiveSlot(a.ctx, resolved)
	})
}

func (a *App) SetActiveSlot(serial string, slot string) (string, error) {
	return auditAction(a, "set_active_slot", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.fbSvc.SetActiveSlot(a.ctx, resolved, slot)
	})
}

func (a *App) RunCustomFastbootCommand(serial string, args string) (string, error) {
	return auditAction(a, "run_fastboot_command", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.fbSvc.RunCustomCommand(a.ctx, resolved, args)
	})
}

func (a *App) SideloadPackage(serial string, zipPath string) (string, error) {
	return auditAction(a, "sideload_package", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.fbSvc.SideloadPackage(a.ctx, resolved, zipPath)
	})
}

func (a *App) IsUserspaceFastboot(serial string) (bool, error) {
	return auditAction(a, "check_userspace_fastboot", func() (bool, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.fbSvc.IsUserspace(a.ctx, resolved)
	})
}

func (a *App) ScanRomFolder(folderPath string) (*flasher.Plan, error) {
	return auditAction(a, "scan_rom_folder", func() (*flasher.Plan, error) {
		return a.fpSvc.ScanRomFolder(folderPath)
	})
}

func (a *App) FlashRomFolder(serial string, folderPath string, plan flasher.Plan) (string, error) {
	return auditAction(a, "flash_rom_folder", func() (string, error) {
		resolved := serial
		if resolved == "" {
			a.mu.Lock()
			resolved = a.activeSerial
			a.mu.Unlock()
		}
		return a.fpSvc.FlashRomFolder(a.ctx, resolved, folderPath, plan)
	})
}

func (a *App) SelectFlashImageFile() (string, error) {
	return a.diaSvc.SelectFlashImageFile()
}

func (a *App) SelectSideloadFile() (string, error) {
	return a.diaSvc.SelectSideloadFile()
}
