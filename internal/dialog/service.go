package dialog

import (
	"ADBKit/internal/core"
	"context"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type PlatformToolsSelection struct {
	Directory    string `json:"directory"`
	AdbPath      string `json:"adbPath"`
	FastbootPath string `json:"fastbootPath"`
}

type Service struct {
	ctx context.Context
}

func New(ctx context.Context) *Service {
	return &Service{ctx: ctx}
}

func (s *Service) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *Service) SelectBinaryFile(name string) (string, error) {
	if s.ctx == nil {
		return "", core.NewOperationError("select_binary_file", "application context is not initialized", "", true)
	}
	if !core.IsSupportedBinaryName(name) {
		return "", core.NewOperationError("select_binary_file", "unsupported binary name", name, false)
	}
	path, err := application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title:           "Select " + name + " binary",
		ShowHiddenFiles: true,
		Filters: []application.FileFilter{
			{DisplayName: "Executable files", Pattern: "*"},
		},
	}).PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *Service) SelectPlatformToolsDirectory() (*PlatformToolsSelection, error) {
	if s.ctx == nil {
		return nil, core.NewOperationError("select_platform_tools_directory", "application context is not initialized", "", true)
	}
	dir, err := application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title:                "Select platform-tools directory",
		CanChooseDirectories: true,
		CanChooseFiles:       false,
	}).PromptForSingleSelection()
	if err != nil {
		return nil, err
	}
	if dir == "" {
		return &PlatformToolsSelection{}, nil
	}
	adbPath := filepath.Join(dir, core.BinaryExecutableName(core.BinaryNameAdb))
	fastbootPath := filepath.Join(dir, core.BinaryExecutableName(core.BinaryNameFastboot))
	adbValid := core.ValidateExecutable(adbPath) == nil
	fastbootValid := core.ValidateExecutable(fastbootPath) == nil
	if !adbValid && !fastbootValid {
		return nil, core.NewOperationError("select_platform_tools_directory", "no adb or fastboot found in selected directory", dir, false)
	}
	return &PlatformToolsSelection{
		Directory:    dir,
		AdbPath:      adbPath,
		FastbootPath: fastbootPath,
	}, nil
}

func (s *Service) SelectApkFile() (string, error) {
	if s.ctx == nil {
		return "", core.NewOperationError("select_apk_file", "application context is not initialized", "", true)
	}
	path, err := application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title:           "Select APK file",
		ShowHiddenFiles: false,
		Filters: []application.FileFilter{
			{DisplayName: "APK files", Pattern: "*.apk"},
		},
	}).PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *Service) SelectSaveFile(defaultFilename string) (string, error) {
	if s.ctx == nil {
		return "", core.NewOperationError("select_save_file", "application context is not initialized", "", true)
	}
	path, err := application.Get().Dialog.SaveFileWithOptions(&application.SaveFileDialogOptions{
		Title:    "Save file",
		Filename: defaultFilename,
	}).PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *Service) SelectFile() (string, error) {
	if s.ctx == nil {
		return "", core.NewOperationError("select_file", "application context is not initialized", "", true)
	}
	path, err := application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title: "Select file",
	}).PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *Service) SelectDirectory() (string, error) {
	if s.ctx == nil {
		return "", core.NewOperationError("select_directory", "application context is not initialized", "", true)
	}
	dir, err := application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title:                "Select directory",
		CanChooseDirectories: true,
		CanChooseFiles:       false,
	}).PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return dir, nil
}

func (s *Service) SelectMultipleFiles() ([]string, error) {
	if s.ctx == nil {
		return nil, core.NewOperationError("select_multiple_files", "application context is not initialized", "", true)
	}
	files, err := application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title:                   "Select files",
		AllowsMultipleSelection: true,
	}).PromptForMultipleSelection()
	if err != nil {
		return nil, err
	}
	return files, nil
}

func (s *Service) SelectFlashImageFile() (string, error) {
	if s.ctx == nil {
		return "", core.NewOperationError("select_flash_image_file", "application context is not initialized", "", true)
	}
	path, err := application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title:           "Select flash image file",
		ShowHiddenFiles: false,
		Filters: []application.FileFilter{
			{DisplayName: "Flash images", Pattern: "*.img;*.bin"},
		},
	}).PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return path, nil
}

func (s *Service) SelectSideloadFile() (string, error) {
	if s.ctx == nil {
		return "", core.NewOperationError("select_sideload_file", "application context is not initialized", "", true)
	}
	path, err := application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		Title:           "Select package for sideload",
		ShowHiddenFiles: false,
		Filters: []application.FileFilter{
			{DisplayName: "ZIP packages", Pattern: "*.zip"},
		},
	}).PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return path, nil
}
