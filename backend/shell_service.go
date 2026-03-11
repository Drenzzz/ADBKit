package backend

import (
	"fmt"
	"strings"
)

func (a *App) RunShellCommand(command string) (string, error) {
	if command == "" {
		return "", fmt.Errorf("command cannot be empty")
	}

	if err := a.validateShellCommand(command); err != nil {
		return "", err
	}

	output, err := a.runShellCommand(command)
	if err != nil {
		return "", fmt.Errorf("command failed: %w. Output: %s", err, output)
	}

	return output, nil
}

func (a *App) RunAdbHostCommand(args string) (string, error) {
	if args == "" {
		return "", fmt.Errorf("command cannot be empty")
	}

	argSlice := strings.Fields(args)

	if err := a.validateHostCommand(argSlice); err != nil {
		return "", err
	}

	output, err := a.runCommand("adb", argSlice...)
	if err != nil {
		return "", fmt.Errorf("command failed: %w. Output: %s", err, output)
	}

	return output, nil
}

func (a *App) SideloadPackage(filePath string) (string, error) {
	output, err := a.runAdbCommand("sideload", filePath)
	if err != nil {
		return "", fmt.Errorf("failed to sideload package: %w. Output: %s", err, output)
	}

	return output, nil
}
