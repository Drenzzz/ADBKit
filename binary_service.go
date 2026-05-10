package main

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	BinaryNameAdb      = "adb"
	BinaryNameFastboot = "fastboot"
	BinaryNameScrcpy   = "scrcpy"
)

type BinaryStatus string

const (
	BinaryFound       BinaryStatus = "found"
	BinaryMissing     BinaryStatus = "missing"
	BinaryInvalid     BinaryStatus = "invalid_path"
	BinaryDownloading BinaryStatus = "downloading"
	BinaryReady       BinaryStatus = "ready"
)

type BinaryInfo struct {
	Name    string       `json:"name"`
	Path    string       `json:"path"`
	Source  string       `json:"source"`
	Status  BinaryStatus `json:"status"`
	Version string       `json:"version,omitempty"`
	Reason  string       `json:"reason,omitempty"`
}

type BinaryService struct {
	dataDir string
}

func NewBinaryService(dataDir string) *BinaryService {
	return &BinaryService{dataDir: dataDir}
}

func (bs *BinaryService) DetectAll(cfg *AppConfig) []*BinaryInfo {
	results := make([]*BinaryInfo, 0, 3)
	results = append(results, bs.Detect(BinaryNameAdb, cfg.AdbPath))
	results = append(results, bs.Detect(BinaryNameFastboot, cfg.FastbootPath))
	results = append(results, bs.Detect(BinaryNameScrcpy, cfg.ScrcpyPath))
	return results
}

func (bs *BinaryService) Detect(name string, configPath string) *BinaryInfo {
	info := &BinaryInfo{Name: name, Status: BinaryMissing}
	if !IsSupportedBinaryName(name) {
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

	if path, err := exec.LookPath(binaryExecutableName(name)); err == nil {
		resolved := bs.resolveCandidate(name, path, "system-path", false)
		if resolved.Status == BinaryReady {
			return resolved
		}
	}

	managedPath := filepath.Join(bs.dataDir, "bin", binaryExecutableName(name))
	resolved := bs.resolveCandidate(name, managedPath, "app-data", false)
	if resolved.Status == BinaryReady {
		return resolved
	}

	for _, candidate := range bs.commonPaths(name) {
		resolved := bs.resolveCandidate(name, candidate, "common-path", false)
		if resolved.Status == BinaryReady {
			return resolved
		}
	}

	return info
}

func (bs *BinaryService) resolveCandidate(name, path, source string, explicit bool) *BinaryInfo {
	info := &BinaryInfo{Name: name, Path: path, Source: source, Status: BinaryMissing}
	if err := ValidateBinaryExecutable(name, path); err != nil {
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
	info.Status = BinaryReady
	info.Version = version
	return info
}

func IsSupportedBinaryName(name string) bool {
	switch name {
	case BinaryNameAdb, BinaryNameFastboot, BinaryNameScrcpy:
		return true
	default:
		return false
	}
}

func binaryExecutableName(name string) string {
	if runtime.GOOS == "windows" {
		return name + ".exe"
	}
	return name
}

func (bs *BinaryService) getVersion(name, path string) (string, error) {
	var lastErr error
	for _, args := range versionCommands(name) {
		ctx := context.Background()
		result, err := RunCommand(ctx, ExecRequest{
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

func (bs *BinaryService) commonPaths(name string) []string {
	home, _ := os.UserHomeDir()
	executable := binaryExecutableName(name)

	switch runtime.GOOS {
	case "linux":
		return []string{
			filepath.Join(home, "Android", "Sdk", "platform-tools", executable),
			filepath.Join("/usr", "bin", executable),
			filepath.Join("/usr", "local", "bin", executable),
		}
	case "darwin":
		return []string{
			filepath.Join(home, "Library", "Android", "sdk", "platform-tools", executable),
			filepath.Join("/usr", "local", "bin", executable),
			filepath.Join("/opt", "homebrew", "bin", executable),
		}
	case "windows":
		appData := os.Getenv("APPDATA")
		return []string{
			filepath.Join(home, "AppData", "Local", "Android", "Sdk", "platform-tools", executable),
			filepath.Join(appData, "adbkit", "bin", executable),
		}
	default:
		return nil
	}
}
