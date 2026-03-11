package backend

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ScanRomFolder scans a directory for standard Android image files
// and maps them to their respective partitions.
func (a *App) ScanRomFolder(folderPath string) (FlashPlan, error) {
	if folderPath == "" {
		return FlashPlan{}, fmt.Errorf("folder path cannot be empty")
	}

	info, err := os.Stat(folderPath)
	if err != nil || !info.IsDir() {
		return FlashPlan{}, fmt.Errorf("invalid directory: %w", err)
	}

	var steps []FlashStep
	// Priority order for safe flashing
	priorityPartitions := []string{
		"boot", "init_boot", "vendor_boot", "dtbo", "vbmeta", "vbmeta_system", "vbmeta_vendor",
		"recovery", "super", "system", "system_ext", "vendor", "product", "odm", "userdata",
	}

	files, err := os.ReadDir(folderPath)
	if err != nil {
		return FlashPlan{}, fmt.Errorf("failed to read directory: %w", err)
	}

	foundImages := make(map[string]string)
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		
		name := strings.ToLower(file.Name())
		if strings.HasSuffix(name, ".img") {
			partitionName := strings.TrimSuffix(name, ".img")
			foundImages[partitionName] = filepath.Join(folderPath, file.Name())
		}
	}

	// Add steps in priority order
	for _, part := range priorityPartitions {
		if imgPath, exists := foundImages[part]; exists {
			steps = append(steps, FlashStep{
				Partition: part,
				ImageFile: imgPath,
			})
			delete(foundImages, part)
		}
	}

	// Add any remaining recognized images
	for part, imgPath := range foundImages {
		if allowedFlashPartitions[part] {
			steps = append(steps, FlashStep{
				Partition: part,
				ImageFile: imgPath,
			})
		}
	}

	return FlashPlan{Steps: steps}, nil
}
