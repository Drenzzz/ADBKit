package packagemgr

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"strings"
	"time"
)

const (
	permissionsTimeout = 10 * time.Second
	permissionSetTimeout = 15 * time.Second
	appOpsSetTimeout     = 15 * time.Second
)

func (s *Service) GetPackagePermissions(ctx context.Context, packageName string) (PackagePermissionsReport, error) {
	trimmed, err := ValidateStrictPackageName(packageName)
	if err != nil {
		return PackagePermissionsReport{}, err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return PackagePermissionsReport{}, err
	}

	// 1) dumpsys package
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "dumpsys", "package", trimmed},
		Timeout: permissionsTimeout,
	})
	if err != nil {
		return PackagePermissionsReport{}, core.NewOperationError("get_package_permissions", "Failed to read package permissions", err.Error(), true)
	}
	// dumpsys can succeed with exit 0 even if package not found - parse will just be empty, still return report
	perms := parseDumpsysPermissions(result.Stdout)

	// 2) appops get with fallback
	var appOps []PackageAppOp
	var supported bool

	// try cmd appops get first
	result, err = core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "cmd", "appops", "get", trimmed},
		Timeout: permissionsTimeout,
	})
	if err == nil && result.ExitCode == 0 {
		appOps, supported = parseAppOps(result.Stdout)
	} else {
		// fallback to legacy `appops get`
		legacy, legErr := core.RunCommand(ctx, core.ExecRequest{
			Command: s.getBinPath().Adb,
			Args:    []string{"-s", serial, "shell", "appops", "get", trimmed},
			Timeout: permissionsTimeout,
		})
		if legErr == nil && legacy.ExitCode == 0 {
			appOps, supported = parseAppOps(legacy.Stdout)
		} else {
			// if both fail, treat as not supported but do not error whole request
			// unless dumpsys also yielded nothing - still return perms
			appOps = []PackageAppOp{}
			supported = false
		}
	}

	report := PackagePermissionsReport{
		PackageName:     trimmed,
		Permissions:     perms,
		AppOps:          appOps,
		AppOpsSupported: supported,
	}
	return report, nil
}

func (s *Service) SetPackagePermission(ctx context.Context, packageName string, permissionName string, granted bool) (string, error) {
	trimmedPkg, err := ValidateStrictPackageName(packageName)
	if err != nil {
		return "", err
	}
	trimmedPerm := strings.TrimSpace(permissionName)
	if !validatePermissionName(trimmedPerm) {
		return "", core.NewOperationError("set_package_permission", "Permission name is invalid", fmt.Sprintf("invalid permission: %q", permissionName), false)
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	action := "revoke"
	if granted {
		action = "grant"
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "pm", action, trimmedPkg, trimmedPerm},
		Timeout: permissionSetTimeout,
	})
	if err != nil {
		return "", core.NewOperationError("set_package_permission", fmt.Sprintf("Failed to %s permission", action), err.Error(), true)
	}
	// pm can output failure to stdout instead of stderr
	if result.ExitCode != 0 || isPMFailureOutput(result.Stdout) || isPMFailureOutput(result.Stderr) {
		detail := strings.TrimSpace(result.Stderr)
		if detail == "" {
			detail = extractFirstLine(result.Stdout)
		}
		if detail == "" {
			detail = fmt.Sprintf("pm %s failed for %s", action, trimmedPerm)
		}
		return "", core.NewOperationError("set_package_permission", fmt.Sprintf("Failed to %s permission", action), detail, true)
	}

	verb := "Revoked"
	if granted {
		verb = "Granted"
	}
	return fallbackMessage(result.Stdout, fmt.Sprintf("%s %s for %s", verb, trimmedPerm, trimmedPkg)), nil
}

func (s *Service) SetPackageAppOp(ctx context.Context, packageName string, opName string, mode string) (string, error) {
	trimmedPkg, err := ValidateStrictPackageName(packageName)
	if err != nil {
		return "", err
	}
	trimmedOp := strings.TrimSpace(opName)
	if !validateAppOpName(trimmedOp) {
		return "", core.NewOperationError("set_package_appop", "AppOp name is invalid", fmt.Sprintf("invalid appop: %q", opName), false)
	}
	trimmedMode := strings.ToLower(strings.TrimSpace(mode))
	if !validateAppOpMode(trimmedMode) {
		return "", core.NewOperationError("set_package_appop", "AppOp mode is invalid", "mode must be allow, deny, ignore, or default", false)
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return "", err
	}

	// Try new: cmd appops set
	result, cmdErr := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "cmd", "appops", "set", trimmedPkg, trimmedOp, trimmedMode},
		Timeout: appOpsSetTimeout,
	})
	if cmdErr == nil && result.ExitCode == 0 {
		return fallbackMessage(result.Stdout, fmt.Sprintf("Set %s to %s for %s", trimmedOp, trimmedMode, trimmedPkg)), nil
	}

	// Fallback: appops set (legacy without cmd)
	legacy, legErr := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "appops", "set", trimmedPkg, trimmedOp, trimmedMode},
		Timeout: appOpsSetTimeout,
	})
	if legErr == nil && legacy.ExitCode == 0 {
		return fallbackMessage(legacy.Stdout, fmt.Sprintf("Set %s to %s for %s", trimmedOp, trimmedMode, trimmedPkg)), nil
	}

	// Both failed - surface most informative error
	detail := ""
	if result != nil {
		detail = strings.TrimSpace(result.Stderr)
		if detail == "" {
			detail = extractFirstLine(result.Stdout)
		}
	}
	if detail == "" && legacy != nil {
		detail = strings.TrimSpace(legacy.Stderr)
		if detail == "" {
			detail = extractFirstLine(legacy.Stdout)
		}
	}
	if detail == "" {
		if cmdErr != nil {
			detail = cmdErr.Error()
		} else if legErr != nil {
			detail = legErr.Error()
		}
	}
	if detail == "" {
		detail = fmt.Sprintf("failed to set appop %s to %s", trimmedOp, trimmedMode)
	}
	return "", core.NewOperationError("set_package_appop", "Failed to set appop", detail, true)
}
