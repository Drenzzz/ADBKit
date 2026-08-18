package flasher

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

const FlashStepStatusEvent = "flash_step_status"

type StepStatus struct {
	Partition string `json:"partition"`
	Status    string `json:"status"`
	Message   string `json:"message"`
}

var priorityPartitions = []string{
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

var recognizedPartitions = map[string]struct{}{
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

type Step struct {
	Partition string `json:"partition"`
	ImageFile string `json:"image_file"`
}

type Plan struct {
	Steps []Step `json:"steps"`
}

type PlanService struct {
	fastbootService *FastbootService
	wailsCtx        context.Context
}

func NewPlanService(fastbootService *FastbootService) *PlanService {
	return &PlanService{fastbootService: fastbootService}
}

// SetWailsContext keeps event emission disabled until the application is ready.
func (s *PlanService) SetWailsContext(ctx context.Context) {
	s.wailsCtx = ctx
}

func (s *PlanService) emitStepStatus(partition, status, message string) {
	if s.wailsCtx == nil {
		return
	}
	application.Get().Event.Emit(FlashStepStatusEvent, StepStatus{
		Partition: partition,
		Status:    status,
		Message:   message,
	})
}

func (s *PlanService) ScanRomFolder(folderPath string) (*Plan, error) {
	trimmed := strings.TrimSpace(folderPath)
	if trimmed == "" {
		return nil, core.NewOperationError("scan_rom_folder", "ROM folder path is required", "", false)
	}
	info, err := os.Stat(trimmed)
	if err != nil {
		return nil, core.NewOperationError("scan_rom_folder", "failed to read ROM folder", err.Error(), true)
	}
	if !info.IsDir() {
		return nil, core.NewOperationError("scan_rom_folder", "ROM folder path is invalid", "path does not point to a directory", false)
	}
	entries, err := os.ReadDir(trimmed)
	if err != nil {
		return nil, core.NewOperationError("scan_rom_folder", "failed to scan ROM folder", err.Error(), true)
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
		if _, recognized := recognizedPartitions[partition]; !recognized {
			continue
		}
		foundImages[partition] = filepath.Join(trimmed, name)
	}
	steps := buildOrderedFlashSteps(foundImages)
	return &Plan{Steps: steps}, nil
}

func (s *PlanService) FlashRomFolder(ctx context.Context, serial string, folderPath string, plan Plan) (string, error) {
	if s.fastbootService == nil {
		return "", core.NewOperationError("flash_rom_folder", "flash plan executor is unavailable", "", false)
	}
	trimmed := strings.TrimSpace(folderPath)
	if trimmed == "" {
		return "", core.NewOperationError("flash_rom_folder", "ROM folder path is required", "", false)
	}
	if len(plan.Steps) == 0 {
		return "", core.NewOperationError("flash_rom_folder", "flash plan is empty", "plan must include at least one flash step", false)
	}
	for i, step := range plan.Steps {
		if strings.TrimSpace(step.Partition) == "" || strings.TrimSpace(step.ImageFile) == "" {
			return "", core.NewOperationError("flash_rom_folder", "flash plan contains an invalid step", fmt.Sprintf("step %d is missing partition or image path", i+1), false)
		}
		if _, err := os.Stat(step.ImageFile); err != nil {
			return "", core.NewOperationError("flash_rom_folder", "flash plan references a missing image", fmt.Sprintf("step %d image does not exist: %s", i+1, step.ImageFile), false)
		}
		// filepath.Rel mencegah path traversal yang lolos dari HasPrefix (mis. "/rom" vs "/rom-evil").
		rel, relErr := filepath.Rel(trimmed, step.ImageFile)
		if relErr != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
			return "", core.NewOperationError("flash_rom_folder", "flash plan image is outside the selected folder", fmt.Sprintf("step %d image path is outside ROM folder", i+1), false)
		}
	}
	for i, step := range plan.Steps {
		s.emitStepStatus(step.Partition, "flashing", "")
		if _, err := s.fastbootService.FlashPartition(ctx, serial, step.Partition, step.ImageFile); err != nil {
			s.emitStepStatus(step.Partition, "error", err.Error())
			return "", core.NewOperationError("flash_rom_folder", "batch flash failed", fmt.Sprintf("step %d failed for partition %s: %s", i+1, step.Partition, err.Error()), true)
		}
		s.emitStepStatus(step.Partition, "success", "Flashed successfully")
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

func buildOrderedFlashSteps(foundImages map[string]string) []Step {
	remaining := make(map[string]string, len(foundImages))
	for partition, imagePath := range foundImages {
		remaining[partition] = imagePath
	}
	steps := make([]Step, 0, len(foundImages))
	for _, partition := range priorityPartitions {
		imagePath, exists := remaining[partition]
		if !exists {
			continue
		}
		steps = append(steps, Step{
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
		steps = append(steps, Step{
			Partition: partition,
			ImageFile: remaining[partition],
		})
	}
	return steps
}
