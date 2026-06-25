package packagemgr

import (
	"ADBKit/internal/core"
	"fmt"
	"sort"
	"strings"
)

func validatePackageName(packageName string) (string, error) {
	trimmed := strings.TrimSpace(packageName)
	if trimmed == "" {
		return "", core.NewOperationError("validate_package_name", "Package name is required", "package name must not be empty", false)
	}
	return trimmed, nil
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

func parseDataSizeFromDumpsys(output string) int64 {
	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if strings.Contains(line, "dataSize=") {
			parts := strings.SplitN(line, "dataSize=", 2)
			if len(parts) == 2 {
				var size int64
				_, err := fmt.Sscanf(strings.TrimSpace(parts[1]), "%d", &size)
				if err == nil && size > 0 {
					return size
				}
			}
		}
		if strings.Contains(line, "Data Size:") {
			parts := strings.SplitN(line, "Data Size:", 2)
			if len(parts) == 2 {
				var size int64
				_, err := fmt.Sscanf(strings.TrimSpace(parts[1]), "%d", &size)
				if err == nil && size > 0 {
					return size
				}
			}
		}
	}
	return -1
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

func sortPackages(packages []Info) []Info {
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
