package main

import (
	"context"
	"fmt"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

const (
	packageFilterUser   = "user"
	packageFilterSystem = "system"
	packageFilterAll    = "all"

	installPackageTimeout = 15 * time.Minute
	pullPackageTimeout    = 10 * time.Minute
	packageDetailsTimeout = 10 * time.Second
)

type PackageFilter string

type PackageInfo struct {
	PackageName string `json:"packageName"`
	IsEnabled   bool   `json:"isEnabled"`
	IsSystemApp bool   `json:"isSystemApp"`
}

type PackageDetails struct {
	PackageName    string `json:"packageName"`
	VersionName    string `json:"versionName"`
	VersionCode    string `json:"versionCode"`
	ApkSizeBytes   int64  `json:"apkSizeBytes"`
	DataSizeBytes  int64  `json:"dataSizeBytes"`
	TotalSizeBytes int64  `json:"totalSizeBytes"`
}

type PackageService struct {
	resolveActiveSerial func(context.Context) (string, error)
	selectSaveFile      func(string) (string, error)
}

func NewPackageService(
	resolveActiveSerial func(context.Context) (string, error),
	selectSaveFile func(string) (string, error),
) *PackageService {
	return &PackageService{
		resolveActiveSerial: resolveActiveSerial,
		selectSaveFile:      selectSaveFile,
	}
}

func (s *PackageService) ListPackages(ctx context.Context, filterType string) ([]PackageInfo, error) {
	scope, err := normalizePackageFilter(filterType)
	if err != nil {
		return nil, err
	}

	if scope == packageFilterAll {
		userPackages, err := s.listPackagesForScope(ctx, packageFilterUser)
		if err != nil {
			return nil, err
		}

		systemPackages, err := s.listPackagesForScope(ctx, packageFilterSystem)
		if err != nil {
			return nil, err
		}

		merged := make(map[string]PackageInfo, len(userPackages)+len(systemPackages))
		for _, pkg := range userPackages {
			merged[pkg.PackageName] = pkg
		}
		for _, pkg := range systemPackages {
			merged[pkg.PackageName] = pkg
		}

		return sortPackages(mapValues(merged)), nil
	}

	packages, err := s.listPackagesForScope(ctx, scope)
	if err != nil {
		return nil, err
	}

	return sortPackages(packages), nil
}

func (s *PackageService) InstallPackage(ctx context.Context, filePath string) (string, error) {
	trimmedPath := strings.TrimSpace(filePath)
	if trimmedPath == "" {
		return "", NewOperationError("install_package", "APK file path is required", "", false)
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	installCtx, cancel := context.WithTimeout(ctx, installPackageTimeout)
	defer cancel()

	result, err := RunCommand(installCtx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "install", "-r", trimmedPath},
		Timeout: installPackageTimeout,
	})
	if err != nil {
		return "", NewOperationError("install_package", "Failed to install APK", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError("install_package", "Failed to install APK", strings.TrimSpace(result.Stderr), true)
	}

	message := extractFirstLine(result.Stdout)
	if message == "" {
		message = fmt.Sprintf("Installed APK from %s", filepath.Base(trimmedPath))
	}

	return message, nil
}

func (s *PackageService) UninstallPackage(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "pm", "uninstall", trimmedName},
		Timeout: 30 * time.Second,
	})
	if err != nil {
		return "", NewOperationError("uninstall_package", "Failed to uninstall package", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError("uninstall_package", "Failed to uninstall package", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Uninstalled %s", trimmedName)), nil
}

func (s *PackageService) ClearPackageData(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "pm", "clear", trimmedName},
		Timeout: 30 * time.Second,
	})
	if err != nil {
		return "", NewOperationError("clear_package_data", "Failed to clear package data", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError("clear_package_data", "Failed to clear package data", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Cleared data for %s", trimmedName)), nil
}

func (s *PackageService) DisablePackage(ctx context.Context, packageName string) (string, error) {
	return s.setPackageEnabledState(ctx, packageName, false)
}

func (s *PackageService) EnablePackage(ctx context.Context, packageName string) (string, error) {
	return s.setPackageEnabledState(ctx, packageName, true)
}

func (s *PackageService) PullPackageApk(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	if s.selectSaveFile == nil {
		return "", NewOperationError("pull_package_apk", "Save file dialog is unavailable", "save file callback is not configured", false)
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	pathResult, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "pm", "path", trimmedName},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", NewOperationError("pull_package_apk", "Failed to resolve APK path", err.Error(), true)
	}
	if pathResult.ExitCode != 0 {
		return "", NewOperationError("pull_package_apk", "Failed to resolve APK path", strings.TrimSpace(pathResult.Stderr), true)
	}

	remotePath, err := parsePackagePathOutput(pathResult.Stdout)
	if err != nil {
		return "", NewOperationError("pull_package_apk", "Failed to resolve APK path", err.Error(), false)
	}

	localPath, err := s.selectSaveFile(trimmedName + ".apk")
	if err != nil {
		return "", NewOperationError("pull_package_apk", "Failed to open save dialog", err.Error(), true)
	}

	if strings.TrimSpace(localPath) == "" {
		return "APK export canceled by user", nil
	}

	pullCtx, cancel := context.WithTimeout(ctx, pullPackageTimeout)
	defer cancel()

	pullResult, err := RunCommand(pullCtx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "pull", remotePath, localPath},
		Timeout: pullPackageTimeout,
	})
	if err != nil {
		return "", NewOperationError("pull_package_apk", "Failed to export APK", err.Error(), true)
	}
	if pullResult.ExitCode != 0 {
		return "", NewOperationError("pull_package_apk", "Failed to export APK", strings.TrimSpace(pullResult.Stderr), true)
	}

	return fallbackMessage(pullResult.Stdout, fmt.Sprintf("Saved APK to %s", localPath)), nil
}

func (s *PackageService) LaunchPackage(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args: []string{
			"-s", serial, "shell", "monkey",
			"-p", trimmedName,
			"-c", "android.intent.category.LAUNCHER",
			"1",
		},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", NewOperationError("launch_package", "Failed to launch package", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError("launch_package", "Failed to launch package", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Launched %s", trimmedName)), nil
}

func (s *PackageService) ForceStopPackage(ctx context.Context, packageName string) (string, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return "", err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "am", "force-stop", trimmedName},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return "", NewOperationError("force_stop_package", "Failed to stop package", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError("force_stop_package", "Failed to stop package", strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, fmt.Sprintf("Stopped %s", trimmedName)), nil
}

func (s *PackageService) GetPackageDetails(ctx context.Context, packageName string) (PackageDetails, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return PackageDetails{}, err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return PackageDetails{}, err
	}

	details := PackageDetails{
		PackageName:  trimmedName,
		ApkSizeBytes: -1,
		DataSizeBytes: -1,
		TotalSizeBytes: -1,
	}

	infoResult, _ := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "dumpsys", "package", trimmedName},
		Timeout: packageDetailsTimeout,
	})
	if infoResult != nil {
		details.VersionName, details.VersionCode = parsePackageVersionOutput(infoResult.Stdout)
	}

	pathResult, _ := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "pm", "path", trimmedName},
		Timeout: packageDetailsTimeout,
	})
	if pathResult != nil {
		remotePath, parseErr := parsePackagePathOutput(pathResult.Stdout)
		if parseErr == nil {
			apkSizeResult, _ := RunCommand(ctx, ExecRequest{
				Command: BinaryNameAdb,
				Args:    []string{"-s", serial, "shell", "stat", "-c", "%s", remotePath},
				Timeout: packageDetailsTimeout,
			})
			if apkSizeResult != nil {
				details.ApkSizeBytes = parseByteSizeOutput(apkSizeResult.Stdout)
			}
		}
	}

	dataSizeResult, _ := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "du", "-s", fmt.Sprintf("/data/data/%s", trimmedName)},
		Timeout: packageDetailsTimeout,
	})
	if dataSizeResult != nil {
		details.DataSizeBytes = parseDUSizeOutput(dataSizeResult.Stdout)
	}

	if details.ApkSizeBytes >= 0 && details.DataSizeBytes >= 0 {
		details.TotalSizeBytes = details.ApkSizeBytes + details.DataSizeBytes
	} else if details.ApkSizeBytes >= 0 {
		details.TotalSizeBytes = details.ApkSizeBytes
	} else if details.DataSizeBytes >= 0 {
		details.TotalSizeBytes = details.DataSizeBytes
	}

	return details, nil
}

func (s *PackageService) UninstallMultiplePackages(ctx context.Context, packageNames []string) (string, error) {
	return s.runBatchOperation(ctx, "uninstall_packages", packageNames, s.UninstallPackage, "uninstalled")
}

func (s *PackageService) DisableMultiplePackages(ctx context.Context, packageNames []string) (string, error) {
	return s.runBatchOperation(ctx, "disable_packages", packageNames, s.DisablePackage, "disabled")
}

func (s *PackageService) EnableMultiplePackages(ctx context.Context, packageNames []string) (string, error) {
	return s.runBatchOperation(ctx, "enable_packages", packageNames, s.EnablePackage, "enabled")
}

func (s *PackageService) listPackagesForScope(ctx context.Context, scope PackageFilter) ([]PackageInfo, error) {
	filterFlag := packageFilterFlag(scope)

	type queryResult struct {
		packages []PackageInfo
		err      error
	}

	results := make(chan queryResult, 2)
	var wg sync.WaitGroup

	for _, enabled := range []bool{true, false} {
		wg.Add(1)
		go func(isEnabled bool) {
			defer wg.Done()
			packages, err := s.queryPackages(ctx, filterFlag, scope == packageFilterSystem, isEnabled)
			results <- queryResult{packages: packages, err: err}
		}(enabled)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	merged := make(map[string]PackageInfo)
	for result := range results {
		if result.err != nil {
			return nil, result.err
		}
		for _, pkg := range result.packages {
			merged[pkg.PackageName] = pkg
		}
	}

	return mapValues(merged), nil
}

func (s *PackageService) queryPackages(ctx context.Context, filterFlag string, isSystemApp bool, isEnabled bool) ([]PackageInfo, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return nil, err
	}

	statusFlag := "-d"
	statusName := "disabled"
	if isEnabled {
		statusFlag = "-e"
		statusName = "enabled"
	}

	args := []string{"-s", serial, "shell", "pm", "list", "packages", statusFlag}
	if filterFlag != "" {
		args = append(args, filterFlag)
	}

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    args,
		Timeout: 15 * time.Second,
	})
	if err != nil {
		return nil, NewOperationError("list_packages", fmt.Sprintf("Failed to list %s packages", statusName), err.Error(), true)
	}
	if result.ExitCode != 0 {
		return nil, NewOperationError("list_packages", fmt.Sprintf("Failed to list %s packages", statusName), strings.TrimSpace(result.Stderr), true)
	}

	return parsePackageListOutput(result.Stdout, isEnabled, isSystemApp), nil
}

func (s *PackageService) setPackageEnabledState(ctx context.Context, packageName string, enabled bool) (string, error) {
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

	result, err := RunCommand(ctx, ExecRequest{
		Command: BinaryNameAdb,
		Args:    commandArgs,
		Timeout: 15 * time.Second,
	})
	if err != nil {
		return "", NewOperationError(operationName, userMessage, err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", NewOperationError(operationName, userMessage, strings.TrimSpace(result.Stderr), true)
	}

	return fallbackMessage(result.Stdout, defaultMsg), nil
}

func (s *PackageService) runBatchOperation(
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
		return "", NewOperationError(operationName, "No packages were selected", "package list must not be empty", false)
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

func (s *PackageService) requireActiveSerial(ctx context.Context) (string, error) {
	if s.resolveActiveSerial == nil {
		return "", NewOperationError("resolve_active_serial", "Device selection is unavailable", "active serial resolver is not configured", false)
	}

	serial, err := s.resolveActiveSerial(ctx)
	if err != nil {
		return "", NewOperationError("resolve_active_serial", "No active device is available", err.Error(), true)
	}

	return strings.TrimSpace(serial), nil
}

func normalizePackageFilter(filterType string) (PackageFilter, error) {
	switch PackageFilter(strings.ToLower(strings.TrimSpace(filterType))) {
	case packageFilterUser:
		return packageFilterUser, nil
	case packageFilterSystem:
		return packageFilterSystem, nil
	case "", packageFilterAll:
		return packageFilterAll, nil
	default:
		return "", NewOperationError("list_packages", "Package filter is invalid", fmt.Sprintf("unsupported filter: %s", filterType), false)
	}
}

func packageFilterFlag(filterType PackageFilter) string {
	switch filterType {
	case packageFilterUser:
		return "-3"
	case packageFilterSystem:
		return "-s"
	default:
		return ""
	}
}

func validatePackageName(packageName string) (string, error) {
	trimmed := strings.TrimSpace(packageName)
	if trimmed == "" {
		return "", NewOperationError("validate_package_name", "Package name is required", "package name must not be empty", false)
	}
	return trimmed, nil
}

func parsePackageListOutput(output string, isEnabled bool, isSystemApp bool) []PackageInfo {
	packages := make([]PackageInfo, 0)
	seen := make(map[string]struct{})

	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if !strings.HasPrefix(line, "package:") {
			continue
		}

		name := strings.TrimSpace(strings.TrimPrefix(line, "package:"))
		if name == "" {
			continue
		}
		if _, exists := seen[name]; exists {
			continue
		}

		seen[name] = struct{}{}
		packages = append(packages, PackageInfo{
			PackageName: name,
			IsEnabled:   isEnabled,
			IsSystemApp: isSystemApp,
		})
	}

	return packages
}

func parsePackagePathOutput(output string) (string, error) {
	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if !strings.HasPrefix(line, "package:") {
			continue
		}

		path := strings.TrimSpace(strings.TrimPrefix(line, "package:"))
		if path != "" {
			return path, nil
		}
	}

	return "", fmt.Errorf("package path was not found in command output")
}

func parsePackageVersionOutput(output string) (string, string) {
	var versionName, versionCode string

	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if strings.Contains(line, "versionName=") {
			versionName = strings.TrimSpace(strings.SplitN(line, "versionName=", 2)[1])
		}
		if strings.Contains(line, "versionCode=") {
			value := strings.TrimSpace(strings.SplitN(line, "versionCode=", 2)[1])
			versionCode = strings.Fields(value)[0]
		}
	}

	return versionName, versionCode
}

func parseByteSizeOutput(output string) int64 {
	line := strings.TrimSpace(extractFirstLine(output))
	if line == "" {
		return -1
	}

	var size int64
	_, err := fmt.Sscanf(line, "%d", &size)
	if err != nil {
		return -1
	}

	return size
}

func parseDUSizeOutput(output string) int64 {
	line := strings.TrimSpace(extractFirstLine(output))
	if line == "" {
		return -1
	}

	var blocks int64
	_, err := fmt.Sscanf(line, "%d", &blocks)
	if err != nil {
		return -1
	}

	return blocks * 1024
}

func extractFirstLine(output string) string {
	for _, line := range strings.Split(output, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func fallbackMessage(output string, fallback string) string {
	line := extractFirstLine(output)
	if line != "" {
		return line
	}
	return fallback
}

func sortPackages(packages []PackageInfo) []PackageInfo {
	sort.Slice(packages, func(i, j int) bool {
		return packages[i].PackageName < packages[j].PackageName
	})
	return packages
}

func mapValues[K comparable, V any](input map[K]V) []V {
	values := make([]V, 0, len(input))
	for _, value := range input {
		values = append(values, value)
	}
	return values
}
