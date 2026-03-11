package backend

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const DefaultCommandTimeout = 60 * time.Second

func (a *App) getBinaryPath(name string) (string, error) {
	a.cacheMutex.RLock()
	if cached, ok := a.binaryCache[name]; ok {
		a.cacheMutex.RUnlock()
		return cached, nil
	}
	a.cacheMutex.RUnlock()

	platformDir := runtime.GOOS
	extension := ""
	if runtime.GOOS == "windows" {
		extension = ".exe"
	}

	candidates := []string{
		filepath.Join(".", "bin", platformDir, name+extension),
		filepath.Join(".", "bin", name+extension),
	}

	exePath, err := os.Executable()
	if err == nil {
		installDir := filepath.Dir(exePath)
		candidates = append(candidates,
			filepath.Join(installDir, "bin", platformDir, name+extension),
			filepath.Join(installDir, "bin", name+extension),
		)
	}

	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}

		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			var resolvedPath string
			if filepath.IsAbs(candidate) {
				resolvedPath = candidate
			} else {
				abs, err := filepath.Abs(candidate)
				if err != nil {
					continue
				}
				resolvedPath = abs
			}

			a.cacheMutex.Lock()
			a.binaryCache[name] = resolvedPath
			a.cacheMutex.Unlock()

			return resolvedPath, nil
		}
	}

	return "", fmt.Errorf("binary '%s' not found. Please ensure 'bin/%s/%s%s' exists", name, platformDir, name, extension)
}

func (a *App) runCommandContext(ctx context.Context, name string, args ...string) (string, error) {
	binaryPath, err := a.getBinaryPath(name)
	if err != nil {
		return "", err
	}

	cmd := exec.CommandContext(ctx, binaryPath, args...)
	setCommandWindowMode(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	start := time.Now()
	err = cmd.Run()
	duration := time.Since(start)

	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			a.logCommand(name, args, duration, fmt.Errorf("timeout"), "")
			return "", fmt.Errorf("command timed out after %s", DefaultCommandTimeout)
		}
		if ctx.Err() == context.Canceled {
			a.logCommand(name, args, duration, fmt.Errorf("cancelled"), "")
			return "", fmt.Errorf("command cancelled by user")
		}

		errOutput := strings.TrimSpace(stderr.String())
		if errOutput == "" {
			errOutput = err.Error()
		}

		a.logCommand(name, args, duration, fmt.Errorf("%s", errOutput), errOutput)

		if strings.Contains(errOutput, "device offline") {
			return "", fmt.Errorf("device is offline. Try reconnecting USB")
		}
		if strings.Contains(errOutput, "unauthorized") {
			return "", fmt.Errorf("unauthorized. Check phone screen to allow USB debugging")
		}

		return "", fmt.Errorf("%s", errOutput)
	}

	outStr := strings.TrimSpace(out.String())
	a.logCommand(name, args, duration, nil, outStr)
	return outStr, nil
}

func (a *App) runCommand(name string, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), DefaultCommandTimeout)
	defer cancel()
	return a.runCommandContext(ctx, name, args...)
}

func (a *App) runCommandWithTimeout(timeout time.Duration, name string, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return a.runCommandContext(ctx, name, args...)
}

func (a *App) runCommandRaw(name string, args ...string) (string, error) {
	// For backward compatibility or unlimited wait if needed (not recommended to use directly)
	return a.runCommandContext(context.Background(), name, args...)
}

func (a *App) resolveActiveAdbSerial() (string, error) {
	if serial := strings.TrimSpace(a.getActiveSerial()); serial != "" {
		return serial, nil
	}

	devices, err := a.GetDevices()
	if err != nil {
		return "", err
	}

	for _, device := range devices {
		if strings.TrimSpace(device.Serial) == "" {
			continue
		}
		status := strings.ToLower(strings.TrimSpace(device.Status))
		if status == "device" || status == "recovery" || status == "sideload" {
			_ = a.SetActiveSerial(device.Serial)
			return device.Serial, nil
		}
	}

	return "", fmt.Errorf("no active device selected")
}

func (a *App) runAdbCommandWithSerial(serial string, args ...string) (string, error) {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return "", fmt.Errorf("device serial cannot be empty")
	}

	commandArgs := append([]string{"-s", trimmedSerial}, args...)
	return a.runCommand("adb", commandArgs...)
}

func (a *App) runAdbCommand(args ...string) (string, error) {
	serial, err := a.resolveActiveAdbSerial()
	if err != nil {
		return "", err
	}
	return a.runAdbCommandWithSerial(serial, args...)
}

func (a *App) runShellCommand(shellCommand string) (string, error) {
	// Security: simplistic check to prevent completely reckless command injection
	// Ideally, shell commands should be avoided in favor of direct args, but adb shell requires it often.
	if strings.ContainsAny(shellCommand, "&|;><$`") {
		return "", fmt.Errorf("illegal characters in command")
	}

	binaryPath, err := a.getBinaryPath("adb")
	if err != nil {
		return "", err
	}

	serial, err := a.resolveActiveAdbSerial()
	if err != nil {
		return "", err
	}

	// Shell commands default to 60s timeout too
	ctx, cancel := context.WithTimeout(context.Background(), DefaultCommandTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, binaryPath, "-s", serial, "shell", shellCommand)
	setCommandWindowMode(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	start := time.Now()
	err = cmd.Run()
	duration := time.Since(start)

	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			a.logCommand("adb", []string{"-s", serial, "shell", shellCommand}, duration, fmt.Errorf("timeout"), "")
			return "", fmt.Errorf("shell command timed out")
		}
		errOutput := strings.TrimSpace(stderr.String())
		if errOutput == "" {
			errOutput = err.Error()
		}

		a.logCommand("adb", []string{"-s", serial, "shell", shellCommand}, duration, fmt.Errorf("%s", errOutput), errOutput)
		return "", fmt.Errorf("shell error: %s", errOutput)
	}

	outStr := strings.TrimSpace(out.String())
	a.logCommand("adb", []string{"-s", serial, "shell", shellCommand}, duration, nil, outStr)
	return outStr, nil
}

func (a *App) CheckSystemRequirements() (string, error) {
	adbPath, err := a.getBinaryPath("adb")
	if err != nil {
		return "", fmt.Errorf("Critical: ADB not found. %w", err)
	}

	if _, err := a.getBinaryPath("fastboot"); err != nil {
		return "", fmt.Errorf("Critical: Fastboot not found. %w", err)
	}

	cmd := exec.Command(adbPath, "--version")
	setCommandWindowMode(cmd)
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("ADB found at %s but failed to run: %v", adbPath, err)
	}

	return "All systems ready", nil
}
