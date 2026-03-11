package backend

import (
	"fmt"
	"strings"
)

func (a *App) WipeData() error {
	output, err := a.runCommand("fastboot", "-w")
	if err != nil {
		return fmt.Errorf("failed to run fastboot -w: %w. Output: %s", err, output)
	}
	return nil
}

func (a *App) FlashPartition(partition string, filePath string) error {
	return a.flashPartitionForSerial("", partition, filePath)
}

func (a *App) flashPartitionForSerial(serial string, partition string, filePath string) error {
	if partition == "" || filePath == "" {
		return fmt.Errorf("partition and file path cannot be empty")
	}

	if err := a.validateFlashPartition(partition); err != nil {
		return err
	}

	if err := a.validateFlashFile(filePath); err != nil {
		return err
	}

	args := []string{"flash", partition, filePath}
	if strings.TrimSpace(serial) != "" {
		args = append([]string{"-s", strings.TrimSpace(serial)}, args...)
	}

	output, err := a.runCommand("fastboot", args...)
	if err != nil {
		return fmt.Errorf("failed to run fastboot flash: %w. Output: %s", err, output)
	}
	return nil
}

func (a *App) GetFastbootDevices() ([]Device, error) {
	// 1. Get fastboot devices
	fastbootOutput, err := a.runCommand("fastboot", "devices")
	var devices []Device

	if err == nil && fastbootOutput != "" {
		lines := strings.Split(fastbootOutput, "\n")
		for _, line := range lines {
			parts := strings.Fields(line)
			// check specifically for fastboot or recovery/sideload if fastboot supports it
			if len(parts) >= 2 {
				devices = append(devices, Device{
					Serial: parts[0],
					Status: parts[1],
				})
			}
		}
	}

	// 2. Also check adb devices for 'sideload' or 'recovery' state
	adbOutput, err := a.runCommand("adb", "devices")
	if err == nil && adbOutput != "" {
		lines := strings.Split(adbOutput, "\n")
		for i, line := range lines {
			if i == 0 || strings.TrimSpace(line) == "" {
				continue // skip header "List of devices attached"
			}
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				status := parts[1]
				if status == "sideload" || status == "recovery" {
					// Check if we already have it to prevent duplicates (unlikely between adb and fastboot, but safe)
					alreadyExists := false
					for _, d := range devices {
						if d.Serial == parts[0] {
							alreadyExists = true
							break
						}
					}
					if !alreadyExists {
						devices = append(devices, Device{
							Serial: parts[0],
							Status: status,
						})
					}
				}
			}
		}
	}

	return devices, nil
}

func (a *App) RunFastbootHostCommand(args string) (string, error) {
	if args == "" {
		return "", fmt.Errorf("command cannot be empty")
	}

	argSlice := strings.Fields(args)

	if err := a.validateHostCommand(argSlice); err != nil {
		return "", err
	}

	output, err := a.runCommand("fastboot", argSlice...)
	if err != nil {
		return "", fmt.Errorf("command failed: %w. Output: %s", err, output)
	}

	return output, nil
}

func (a *App) FlashRomFolder(serial string, folderPath string, plan FlashPlan) error {
	if folderPath == "" || len(plan.Steps) == 0 {
		return fmt.Errorf("invalid flash plan or empty folder path")
	}

	for i, step := range plan.Steps {
		a.logCommand("fastboot", []string{"-s", serial, "flash", step.Partition, step.ImageFile}, 0, nil, fmt.Sprintf("Starting step %d: Flashing %s", i+1, step.Partition))

		err := a.flashPartitionForSerial(serial, step.Partition, step.ImageFile)
		if err != nil {
			return fmt.Errorf("failed at step %d (partition %s): %w", i+1, step.Partition, err)
		}
	}

	return nil
}

func (a *App) GetFastbootSlot(serial string) (string, error) {
	if serial == "" {
		return "", fmt.Errorf("serial cannot be empty")
	}

	output, err := a.runCommand("fastboot", "-s", serial, "getvar", "current-slot")
	if err != nil {
		return "", fmt.Errorf("failed to get current slot: %w. Output: %s", err, output)
	}

	// fastboot getvar current-slot output typically looks like:
	// current-slot: a
	// Finished. Total time: 0.002s
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "current-slot:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				slot := strings.TrimSpace(parts[1])
				// Valid slots are usually 'a' or 'b', sometimes '' if not A/B
				if slot == "a" || slot == "b" {
					return slot, nil
				}
				if slot == "" {
					return "", fmt.Errorf("device does not seem to support A/B slots")
				}
				return slot, nil
			}
		}
	}

	return "", fmt.Errorf("could not parse slot from fastboot output: %s", output)
}

func (a *App) SetFastbootSlot(serial string, slot string) error {
	if serial == "" || slot == "" {
		return fmt.Errorf("serial and slot cannot be empty")
	}

	slotLower := strings.ToLower(strings.TrimSpace(slot))
	if slotLower != "a" && slotLower != "b" {
		return fmt.Errorf("invalid slot: '%s'. only 'a' or 'b' allowed", slot)
	}

	a.logCommand("fastboot", []string{"-s", serial, "set_active", slotLower}, 0, nil, fmt.Sprintf("Setting active slot to %s", slotLower))

	output, err := a.runCommand("fastboot", "-s", serial, "set_active", slotLower)
	if err != nil {
		return fmt.Errorf("failed to set active slot: %w. Output: %s", err, output)
	}

	return nil
}
