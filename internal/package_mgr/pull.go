package packagemgr

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"strings"
	"time"
)

func (s *Service) PullPackageApk(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	if s.selectSaveFile == nil {
		return "", core.NewOperationError("pull_package_apk", "Save file dialog is unavailable", "save file callback is not configured", false)
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	pathResult, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "pm", "path", trimmedName},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", core.NewOperationError("pull_package_apk", "Failed to resolve APK path", err.Error(), true)
	}
	if pathResult.ExitCode != 0 {
		return "", core.NewOperationError("pull_package_apk", "Failed to resolve APK path", strings.TrimSpace(pathResult.Stderr), true)
	}

	remotePath, err := parsePackagePathOutput(pathResult.Stdout)
	if err != nil {
		return "", core.NewOperationError("pull_package_apk", "Failed to resolve APK path", err.Error(), false)
	}

	localPath, err := s.selectSaveFile(trimmedName + ".apk")
	if err != nil {
		return "", core.NewOperationError("pull_package_apk", "Failed to open save dialog", err.Error(), true)
	}

	if strings.TrimSpace(localPath) == "" {
		return "APK export canceled by user", nil
	}

	pullCtx, cancel := context.WithTimeout(ctx, pullPackageTimeout)
	defer cancel()

	pullResult, err := core.RunCommand(pullCtx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "pull", remotePath, localPath},
		Timeout: pullPackageTimeout,
	})
	if err != nil {
		return "", core.NewOperationError("pull_package_apk", "Failed to export APK", err.Error(), true)
	}
	if pullResult.ExitCode != 0 {
		return "", core.NewOperationError("pull_package_apk", "Failed to export APK", strings.TrimSpace(pullResult.Stderr), true)
	}

	return fallbackMessage(pullResult.Stdout, fmt.Sprintf("Saved APK to %s", localPath)), nil
}
