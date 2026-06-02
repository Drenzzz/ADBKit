package main

import (
	"context"
	"path/filepath"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type PlatformToolsSelection struct {
	Directory    string `json:"directory"`
	AdbPath      string `json:"adbPath"`
	FastbootPath string `json:"fastbootPath"`
}

type DialogService struct {
	ctx context.Context
}

func NewDialogService(ctx context.Context) *DialogService {
	return &DialogService{ctx: ctx}
}

func (s *DialogService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *DialogService) SelectBinaryFile(name string) (string, error) {
	if s.ctx == nil {
		return "", NewOperationError("select_binary_file", "application context is not initialized", "", true)
	}
	if !IsSupportedBinaryName(name) {
		return "", NewOperationError("select_binary_file", "unsupported binary name", name, false)
	}
	path, err := wailsruntime.OpenFileDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title:           "Select " + name + " binary",
		ShowHiddenFiles: true,
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "Executable files", Pattern: "*"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *DialogService) SelectPlatformToolsDirectory() (*PlatformToolsSelection, error) {
	if s.ctx == nil {
		return nil, NewOperationError("select_platform_tools_directory", "application context is not initialized", "", true)
	}
	dir, err := wailsruntime.OpenDirectoryDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select platform-tools directory",
	})
	if err != nil {
		return nil, err
	}
	if dir == "" {
		return &PlatformToolsSelection{}, nil
	}
	adbPath := filepath.Join(dir, binaryExecutableName(BinaryNameAdb))
	fastbootPath := filepath.Join(dir, binaryExecutableName(BinaryNameFastboot))
	adbValid := ValidateExecutable(adbPath) == nil
	fastbootValid := ValidateExecutable(fastbootPath) == nil
	if !adbValid && !fastbootValid {
		return nil, NewOperationError("select_platform_tools_directory", "no adb or fastboot found in selected directory", dir, false)
	}
	return &PlatformToolsSelection{
		Directory:    dir,
		AdbPath:      adbPath,
		FastbootPath: fastbootPath,
	}, nil
}

func (s *DialogService) SelectApkFile() (string, error) {
	if s.ctx == nil {
		return "", NewOperationError("select_apk_file", "application context is not initialized", "", true)
	}
	path, err := wailsruntime.OpenFileDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title:           "Select APK file",
		ShowHiddenFiles: false,
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "APK files", Pattern: "*.apk"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *DialogService) SelectSaveFile(defaultFilename string) (string, error) {
	if s.ctx == nil {
		return "", NewOperationError("select_save_file", "application context is not initialized", "", true)
	}
	path, err := wailsruntime.SaveFileDialog(s.ctx, wailsruntime.SaveDialogOptions{
		Title:           "Save file",
		DefaultFilename: defaultFilename,
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *DialogService) SelectFile() (string, error) {
	if s.ctx == nil {
		return "", NewOperationError("select_file", "application context is not initialized", "", true)
	}
	path, err := wailsruntime.OpenFileDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select file",
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *DialogService) SelectDirectory() (string, error) {
	if s.ctx == nil {
		return "", NewOperationError("select_directory", "application context is not initialized", "", true)
	}
	dir, err := wailsruntime.OpenDirectoryDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select directory",
	})
	if err != nil {
		return "", err
	}
	return dir, nil
}

func (s *DialogService) SelectMultipleFiles() ([]string, error) {
	if s.ctx == nil {
		return nil, NewOperationError("select_multiple_files", "application context is not initialized", "", true)
	}
	files, err := wailsruntime.OpenMultipleFilesDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select files",
	})
	if err != nil {
		return nil, err
	}
	return files, nil
}

func (s *DialogService) SelectFlashImageFile() (string, error) {
	if s.ctx == nil {
		return "", NewOperationError("select_flash_image_file", "application context is not initialized", "", true)
	}
	path, err := wailsruntime.OpenFileDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title:           "Select flash image file",
		ShowHiddenFiles: false,
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "Flash images", Pattern: "*.img;*.bin"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *DialogService) SelectSideloadFile() (string, error) {
	if s.ctx == nil {
		return "", NewOperationError("select_sideload_file", "application context is not initialized", "", true)
	}
	path, err := wailsruntime.OpenFileDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title:           "Select package for sideload",
		ShowHiddenFiles: false,
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "ZIP packages", Pattern: "*.zip"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}
