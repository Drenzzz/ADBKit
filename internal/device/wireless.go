package device

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"strings"
)

type WirelessService struct {
	dataDir    string
	getBinPath func() core.BinaryPaths
}

func NewWirelessService(dataDir string, getBinPath func() core.BinaryPaths) *WirelessService {
	return &WirelessService{dataDir: dataDir, getBinPath: getBinPath}
}

func (s *WirelessService) Connect(ctx context.Context, address string) (string, error) {
	address = strings.TrimSpace(address)
	if address == "" || !strings.Contains(address, ":") {
		return "", core.NewOperationError("connect_wireless", "wireless address is invalid", "address must use host:port format", false)
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"connect", address},
		Timeout: 10e9,
	})
	if err != nil {
		return "", core.NewOperationError("connect_wireless", "failed to connect wireless device", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("connect_wireless", "wireless connect failed", strings.TrimSpace(result.Stderr), true)
	}

	message := extractFirstOutputLine(result.Stdout)
	if message == "" {
		message = fmt.Sprintf("Connected to %s", address)
	}
	return message, nil
}

func (s *WirelessService) EnableTCPIP(ctx context.Context, serial string, port string) (string, error) {
	trimmedSerial := strings.TrimSpace(serial)
	trimmedPort := strings.TrimSpace(port)
	if trimmedSerial == "" {
		return "", core.NewOperationError("enable_wireless_tcpip", "device serial is required", "serial must not be empty", false)
	}
	if trimmedPort == "" {
		trimmedPort = "5555"
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", trimmedSerial, "tcpip", trimmedPort},
		Timeout: 10e9,
	})
	if err != nil {
		return "", core.NewOperationError("enable_wireless_tcpip", "failed to enable wireless TCP/IP mode", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("enable_wireless_tcpip", "tcpip command failed", strings.TrimSpace(result.Stderr), true)
	}

	message := extractFirstOutputLine(result.Stdout)
	if message == "" {
		message = fmt.Sprintf("ADB restarted in TCP/IP mode on port %s", trimmedPort)
	}
	return message, nil
}

func (s *WirelessService) Disconnect(ctx context.Context, address string) (string, error) {
	args := []string{"disconnect"}
	trimmedAddress := strings.TrimSpace(address)
	if trimmedAddress != "" {
		args = append(args, trimmedAddress)
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    args,
		Timeout: 10e9,
	})
	if err != nil {
		return "", core.NewOperationError("disconnect_wireless", "failed to disconnect wireless device", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return "", core.NewOperationError("disconnect_wireless", "disconnect failed", strings.TrimSpace(result.Stderr), true)
	}

	message := extractFirstOutputLine(result.Stdout)
	if message == "" {
		if trimmedAddress == "" {
			message = "Disconnected wireless devices"
		} else {
			message = fmt.Sprintf("Disconnected %s", trimmedAddress)
		}
	}
	return message, nil
}

func extractFirstOutputLine(output string) string {
	for _, line := range strings.Split(output, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}
