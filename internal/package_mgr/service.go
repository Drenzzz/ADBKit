package packagemgr

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"
)

const (
	filterUser   Filter = "user"
	filterSystem Filter = "system"
	filterAll    Filter = "all"

	installPackageTimeout = 15 * time.Minute
	pullPackageTimeout    = 10 * time.Minute
	packageDetailsTimeout = 10 * time.Second
)

type Service struct {
	resolveActiveSerial func(context.Context) (string, error)
	selectSaveFile      func(string) (string, error)
	getBinPath          func() core.BinaryPaths
}

func NewService(
	resolveActiveSerial func(context.Context) (string, error),
	selectSaveFile func(string) (string, error),
	getBinPath func() core.BinaryPaths,
) *Service {
	return &Service{
		resolveActiveSerial: resolveActiveSerial,
		selectSaveFile:      selectSaveFile,
		getBinPath:          getBinPath,
	}
}

func (s *Service) requireActiveSerial(ctx context.Context) (string, error) {
	if s.resolveActiveSerial == nil {
		return "", core.NewOperationError("resolve_active_serial", "Device selection is unavailable", "active serial resolver is not configured", false)
	}

	serial, err := s.resolveActiveSerial(ctx)
	if err != nil {
		return "", core.NewOperationError("resolve_active_serial", "No active device is available", err.Error(), true)
	}

	return strings.TrimSpace(serial), nil
}

func (s *Service) InstallPackage(ctx context.Context, filePath string) (string, error) {
	trimmedPath := strings.TrimSpace(filePath)
	if err := core.ValidateAPKFile(trimmedPath); err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	installCtx, cancel := context.WithTimeout(ctx, installPackageTimeout)
	defer cancel()

	result, err := core.RunCommand(installCtx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "install", "-r", trimmedPath},
		Timeout: installPackageTimeout,
	})
	if err != nil {
		return "", core.NewOperationError("install_package", "Failed to install APK", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("install_package", "Failed to install APK", strings.TrimSpace(result.Stderr), true)
	}

	message := extractFirstLine(result.Stdout)
	if message == "" {
		message = fmt.Sprintf("Installed APK from %s", filepath.Base(trimmedPath))
	}

	return message, nil
}

func (s *Service) LaunchPackage(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args: []string{
			"-s", serial, "shell", "monkey",
			"-p", trimmedName,
			"-c", "android.intent.category.LAUNCHER",
			"1",
		},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError("launch_package", "Failed to launch package", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("launch_package", "Failed to launch package", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Launched %s", trimmedName)), nil
}

func (s *Service) ForceStopPackage(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "am", "force-stop", trimmedName},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError("force_stop_package", "Failed to stop package", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("force_stop_package", "Failed to stop package", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Stopped %s", trimmedName)), nil
}

func (s *Service) ClearPackageData(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "pm", "clear", trimmedName},
		Timeout: 30 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError("clear_package_data", "Failed to clear package data", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("clear_package_data", "Failed to clear package data", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Cleared data for %s", trimmedName)), nil
}
