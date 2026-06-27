package packagemgr

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"strings"
	"time"
)

func (s *Service) UninstallPackage(ctx context.Context, packageName string) (string, error) {
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
		Args:    []string{"-s", serial, "shell", "pm", "uninstall", trimmedName},
		Timeout: 30 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError("uninstall_package", "Failed to uninstall package", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("uninstall_package", "Failed to uninstall package", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Uninstalled %s", trimmedName)), nil
}

func (s *Service) DisablePackage(ctx context.Context, packageName string) (string, error) {
	return s.setPackageEnabledState(ctx, packageName, false)
}

func (s *Service) EnablePackage(ctx context.Context, packageName string) (string, error) {
	return s.setPackageEnabledState(ctx, packageName, true)
}

func (s *Service) UninstallMultiplePackages(ctx context.Context, packageNames []string) (string, error) {
	return s.runBatchOperation(ctx, "uninstall_packages", packageNames, s.UninstallPackage, "uninstalled")
}

func (s *Service) DisableMultiplePackages(ctx context.Context, packageNames []string) (string, error) {
	return s.runBatchOperation(ctx, "disable_packages", packageNames, s.DisablePackage, "disabled")
}

func (s *Service) EnableMultiplePackages(ctx context.Context, packageNames []string) (string, error) {
	return s.runBatchOperation(ctx, "enable_packages", packageNames, s.EnablePackage, "enabled")
}

func (s *Service) setPackageEnabledState(ctx context.Context, packageName string, enabled bool) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	operationName := "disable_package"
	userMessage := "Failed to disable package"
	commandArgs := []string{"-s", serial, "shell", "pm", "disable-user", "--user", "0", trimmedName}
	defaultMsg := fmt.Sprintf("Disabled %s", trimmedName)
	if enabled {
		operationName = "enable_package"
		userMessage = "Failed to enable package"
		commandArgs = []string{"-s", serial, "shell", "pm", "enable", "--user", "0", trimmedName}
		defaultMsg = fmt.Sprintf("Enabled %s", trimmedName)
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    commandArgs,
		Timeout: 15 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError(operationName, userMessage, err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError(operationName, userMessage, strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, defaultMsg), nil
}

func (s *Service) runBatchOperation(
	ctx context.Context,
	operationName string,
	packageNames []string,
	operation func(context.Context, string) (string, error),
	action string,
) (string, error) {
	trimmedNames := make([]string, 0, len(packageNames))
	for _, name := range packageNames {
		trimmed := strings.TrimSpace(name)
		if trimmed != "" {
			trimmedNames = append(trimmedNames, trimmed)
		}
	}

	if len(trimmedNames) == 0 {
		return "", core.NewOperationError(operationName, "No packages were selected", "package list must not be empty", false)
	}

	successCount := 0
	failures := make([]string, 0)
	for _, name := range trimmedNames {
		_, err := operation(ctx, name)
		if err != nil {
			failures = append(failures, fmt.Sprintf("%s: %s", name, err.Error()))
			continue
		}
		successCount++
	}

	message := fmt.Sprintf("Successfully %s %d package(s)", action, successCount)
	if len(failures) == 0 {
		return message, nil
	}

	message = fmt.Sprintf("%s. Failed: %d. Details: %s", message, len(failures), strings.Join(failures, " | "))
	return message, nil
}
