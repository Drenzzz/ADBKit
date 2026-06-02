package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

var flashPlanPriorityPartitions = []string{
	"boot",
	"init_boot",
	"vendor_boot",
	"dtbo",
	"vbmeta",
	"vbmeta_system",
	"vbmeta_vendor",
	"recovery",
	"super",
	"system",
	"system_ext",
	"vendor",
	"product",
	"odm",
	"userdata",
}

var flashPlanRecognizedPartitions = map[string]struct{}{
	"boot":          {},
	"boot_a":        {},
	"boot_b":        {},
	"init_boot":     {},
	"init_boot_a":   {},
	"init_boot_b":   {},
	"vendor_boot":   {},
	"vendor_boot_a": {},
	"vendor_boot_b": {},
	"dtbo":          {},
	"vbmeta":        {},
	"vbmeta_system": {},
	"vbmeta_vendor": {},
	"recovery":      {},
	"recovery_a":    {},
	"recovery_b":    {},
	"super":         {},
	"system":        {},
	"system_ext":    {},
	"vendor":        {},
	"product":       {},
	"odm":           {},
	"userdata":      {},
}

type FlashStep struct {
	Partition string `json:"partition"`
	ImageFile string `json:"image_file"`
}

type FlashPlan struct {
	Steps []FlashStep `json:"steps"`
}

type FlashPlanService struct {
	fastbootService *FastbootService
}

func NewFlashPlanService(fastbootService *FastbootService) *FlashPlanService {
	return &FlashPlanService{fastbootService: fastbootService}
}

func (s *FlashPlanService) ScanRomFolder(folderPath string) (*FlashPlan, error) {
	trimmed := strings.TrimSpace(folderPath)
	if trimmed == "" {
		return nil, NewOperationError("scan_rom_folder", "ROM folder path is required", "", false)
	}
	info, err := os.Stat(trimmed)
	if err != nil {
		return nil, NewOperationError("scan_rom_folder", "failed to read ROM folder", err.Error(), true)
	}
	if !info.IsDir() {
		return nil, NewOperationError("scan_rom_folder", "ROM folder path is invalid", "path does not point to a directory", false)
	}
	entries, err := os.ReadDir(trimmed)
	if err != nil {
		return nil, NewOperationError("scan_rom_folder", "failed to scan ROM folder", err.Error(), true)
	}
	foundImages := make(map[string]string)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		partition, ok := partitionNameFromImage(name)
		if !ok {
			continue
		}
		if _, recognized := flashPlanRecognizedPartitions[partition]; !recognized {
			continue
		}
		foundImages[partition] = filepath.Join(trimmed, name)
	}
	steps := buildOrderedFlashSteps(foundImages)
	return &FlashPlan{Steps: steps}, nil
}

func (s *FlashPlanService) FlashRomFolder(ctx context.Context, serial string, folderPath string, plan FlashPlan) (string, error) {
	if s.fastbootService == nil {
		return "", NewOperationError("flash_rom_folder", "flash plan executor is unavailable", "", false)
	}
	trimmed := strings.TrimSpace(folderPath)
	if trimmed == "" {
		return "", NewOperationError("flash_rom_folder", "ROM folder path is required", "", false)
	}
	if len(plan.Steps) == 0 {
		return "", NewOperationError("flash_rom_folder", "flash plan is empty", "plan must include at least one flash step", false)
	}
	for i, step := range plan.Steps {
		if strings.TrimSpace(step.Partition) == "" || strings.TrimSpace(step.ImageFile) == "" {
			return "", NewOperationError("flash_rom_folder", "flash plan contains an invalid step", fmt.Sprintf("step %d is missing partition or image path", i+1), false)
		}
		if _, err := os.Stat(step.ImageFile); err != nil {
			return "", NewOperationError("flash_rom_folder", "flash plan references a missing image", fmt.Sprintf("step %d image does not exist: %s", i+1, step.ImageFile), false)
		}
		if !strings.HasPrefix(step.ImageFile, trimmed) {
			return "", NewOperationError("flash_rom_folder", "flash plan image is outside the selected folder", fmt.Sprintf("step %d image path is outside ROM folder", i+1), false)
		}
	}
	for i, step := range plan.Steps {
		if _, err := s.fastbootService.FlashPartition(ctx, serial, step.Partition, step.ImageFile); err != nil {
			return "", NewOperationError("flash_rom_folder", "batch flash failed", fmt.Sprintf("step %d failed for partition %s: %s", i+1, step.Partition, err.Error()), true)
		}
	}
	return fmt.Sprintf("Flashed %d partition(s) from %s", len(plan.Steps), filepath.Base(trimmed)), nil
}

func partitionNameFromImage(name string) (string, bool) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return "", false
	}
	extension := strings.ToLower(filepath.Ext(trimmed))
	if extension != ".img" {
		return "", false
	}
	partition := strings.ToLower(strings.TrimSuffix(trimmed, filepath.Ext(trimmed)))
	if partition == "" {
		return "", false
	}
	return partition, true
}

func buildOrderedFlashSteps(foundImages map[string]string) []FlashStep {
	remaining := make(map[string]string, len(foundImages))
	for partition, imagePath := range foundImages {
		remaining[partition] = imagePath
	}
	steps := make([]FlashStep, 0, len(foundImages))
	for _, partition := range flashPlanPriorityPartitions {
		imagePath, exists := remaining[partition]
		if !exists {
			continue
		}
		steps = append(steps, FlashStep{
			Partition: partition,
			ImageFile: imagePath,
		})
		delete(remaining, partition)
	}
	leftovers := make([]string, 0, len(remaining))
	for partition := range remaining {
		leftovers = append(leftovers, partition)
	}
	sort.Strings(leftovers)
	for _, partition := range leftovers {
		steps = append(steps, FlashStep{
			Partition: partition,
			ImageFile: remaining[partition],
		})
	}
	return steps
}
