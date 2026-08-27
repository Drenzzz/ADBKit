package binary

import (
	"ADBKit/internal/core"
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

func (bs *Service) Detect(name string, configPath string) *BinaryInfo {
	info := &BinaryInfo{Name: name, Status: BinaryMissing}
	if !core.IsSupportedBinaryName(name) {
		info.Status = BinaryInvalid
		info.Reason = "unsupported binary name"
		return info
	}

	if configPath != "" {
		resolved := bs.resolveCandidate(name, configPath, "config", true)
		if resolved.Status == BinaryReady {
			return resolved
		}
		info = resolved
	}

	if path, err := exec.LookPath(core.BinaryExecutableName(name)); err == nil {
		resolved := bs.resolveCandidate(name, path, "system-path", false)
		if resolved.Status == BinaryReady {
			return resolved
		}
	}

	managedPath := joinManagedPath(bs.dataDir, name)
	resolved := bs.resolveCandidate(name, managedPath, "app-data", false)
	if resolved.Status == BinaryReady {
		return resolved
	}

	for _, candidate := range bs.candidateCommonPaths(name) {
		resolved := bs.resolveCandidate(name, candidate, "common-path", false)
		if resolved.Status == BinaryReady {
			return resolved
		}
	}

	return info
}

func (bs *Service) candidateCommonPaths(name string) []string {
	if bs.commonPathsOverride != nil {
		return bs.commonPathsOverride(name)
	}
	return bs.commonPaths(name)
}

func (bs *Service) resolveCandidate(name, path, source string, explicit bool) *BinaryInfo {
	info := &BinaryInfo{Name: name, Path: path, Source: source, Status: BinaryMissing}
	if err := core.ValidateBinaryExecutable(name, path); err != nil {
		if explicit {
			info.Status = BinaryInvalid
			info.Reason = err.Error()
		}
		return info
	}
	version, err := bs.getVersion(name, path)
	if err != nil {
		info.Status = BinaryInvalid
		info.Reason = err.Error()
		return info
	}
	if source == "app-data" {
		if pkgErr := bs.validatePackageCompleteness(name, path); pkgErr != nil {
			info.Status = BinaryInvalid
			info.Reason = pkgErr.Error()
			return info
		}
	}
	info.Status = BinaryReady
	info.Version = version
	return info
}

func (bs *Service) validatePackageCompleteness(name, path string) error {
	dir := filepath.Dir(path)
	switch name {
	case BinaryNameScrcpy:
		serverPath := filepath.Join(dir, "scrcpy-server")
		if _, err := os.Stat(serverPath); os.IsNotExist(err) {
			return core.NewOperationError("validate_package", "incomplete package: missing scrcpy-server", dir, false)
		}
	case BinaryNameAdb, BinaryNameFastboot:
		if runtime.GOOS == "windows" {
			// Platform Tools on Windows ships with two DLLs (AdbWinApi.dll and
			// AdbWinUsbApi.dll) that adb.exe loads at runtime. Without them,
			// adb launches but exits immediately with no output.
			for _, dll := range []string{"AdbWinApi.dll", "AdbWinUsbApi.dll"} {
				dllPath := filepath.Join(dir, dll)
				if _, err := os.Stat(dllPath); os.IsNotExist(err) {
					return core.NewOperationError("validate_package", "incomplete package: missing Windows runtime DLL", dll, false)
				}
			}
			return nil
		}
		libDir := filepath.Join(dir, "lib64")
		if _, err := os.Stat(libDir); os.IsNotExist(err) {
			return core.NewOperationError("validate_package", "incomplete package: missing lib64 directory", dir, false)
		}
	}
	return nil
}

func (bs *Service) getVersion(name, path string) (string, error) {
	var lastErr error
	for _, args := range versionCommands(name) {
		ctx := context.Background()
		result, err := core.RunCommand(ctx, core.ExecRequest{
			Command: path,
			Args:    args,
			Timeout: 5 * time.Second,
		})
		if err != nil {
			lastErr = err
			continue
		}
		if result.ExitCode != 0 {
			lastErr = errors.New(strings.TrimSpace(result.Stderr))
			continue
		}
		version := parseVersion(result.Stdout)
		if version == "" {
			version = parseVersion(result.Stderr)
		}
		if version != "" {
			return version, nil
		}
		lastErr = errors.New("version output is empty")
	}
	if lastErr != nil {
		return "", lastErr
	}
	return "", errors.New("version command is unavailable")
}

func versionCommands(name string) [][]string {
	switch name {
	case BinaryNameAdb:
		return [][]string{{"version"}}
	case BinaryNameFastboot:
		return [][]string{{"--version"}, {"version"}}
	case BinaryNameScrcpy:
		return [][]string{{"--version"}}
	default:
		return [][]string{{"--version"}}
	}
}

func parseVersion(output string) string {
	for _, line := range strings.Split(output, "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			return line
		}
	}
	return ""
}

func (bs *Service) DetectAllCandidates(name string, configPath string) []BinaryInfo {
	seen := make(map[string]bool)
	var candidates []BinaryInfo

	addIfValid := func(info *BinaryInfo) {
		if info.Status != BinaryReady {
			return
		}
		if seen[info.Path] {
			return
		}
		seen[info.Path] = true
		candidates = append(candidates, *info)
	}

	if configPath != "" {
		addIfValid(bs.resolveCandidate(name, configPath, "config", true))
	}

	if path, err := exec.LookPath(core.BinaryExecutableName(name)); err == nil {
		addIfValid(bs.resolveCandidate(name, path, "system-path", false))
	}

	managedPath := joinManagedPath(bs.dataDir, name)
	addIfValid(bs.resolveCandidate(name, managedPath, "app-data", false))

	for _, candidatePath := range bs.candidateCommonPaths(name) {
		addIfValid(bs.resolveCandidate(name, candidatePath, "common-path", false))
	}

	return candidates
}
