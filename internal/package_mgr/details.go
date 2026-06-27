package packagemgr

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
)

func (s *Service) GetPackageDetails(ctx context.Context, packageName string) (Details, error) {
	trimmedName, err := validatePackageName(packageName)
	if err != nil {
		return Details{}, err
	}

	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return Details{}, err
	}

	details := Details{
		PackageName:   trimmedName,
		ApkSizeBytes:  -1,
		DataSizeBytes: -1,
	}

	infoResult, _ := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "dumpsys", "package", trimmedName},
		Timeout: packageDetailsTimeout,
	})
	if infoResult != nil {
		details.VersionName, details.VersionCode = parsePackageVersionOutput(infoResult.Stdout)
		details.DataSizeBytes = parseDataSizeFromDumpsys(infoResult.Stdout)
	}

	pathResult, _ := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "pm", "path", trimmedName},
		Timeout: packageDetailsTimeout,
	})
	if pathResult != nil {
		remotePath, parseErr := parsePackagePathOutput(pathResult.Stdout)
		if parseErr == nil {
			apkSizeResult, _ := core.RunCommand(ctx, core.ExecRequest{
				Command: s.getBinPath().Adb,
				Args:    []string{"-s", serial, "shell", "stat", "-c", "%s", remotePath},
				Timeout: packageDetailsTimeout,
			})
			if apkSizeResult != nil {
				details.ApkSizeBytes = parseByteSizeOutput(apkSizeResult.Stdout)
			}
		}
	}

	if details.DataSizeBytes < 0 {
		dataSizeResult, _ := core.RunCommand(ctx, core.ExecRequest{
			Command: s.getBinPath().Adb,
			Args:    []string{"-s", serial, "shell", "du", "-s", fmt.Sprintf("/data/data/%s", trimmedName)},
			Timeout: packageDetailsTimeout,
		})
		if dataSizeResult != nil && dataSizeResult.ExitCode == 0 {
			details.DataSizeBytes = parseDUSizeOutput(dataSizeResult.Stdout)
		}
	}

	if details.DataSizeBytes < 0 {
		dataSizeResult, _ := core.RunCommand(ctx, core.ExecRequest{
			Command: s.getBinPath().Adb,
			Args:    []string{"-s", serial, "shell", "du", "-s", fmt.Sprintf("/data/user/0/%s", trimmedName)},
			Timeout: packageDetailsTimeout,
		})
		if dataSizeResult != nil && dataSizeResult.ExitCode == 0 {
			details.DataSizeBytes = parseDUSizeOutput(dataSizeResult.Stdout)
		}
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
