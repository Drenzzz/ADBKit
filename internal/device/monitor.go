package device

import (
	"ADBKit/internal/core"
	"context"
	"strconv"
	"strings"
	"sync"
	"time"
)

type monitorSnapshot struct {
	rxBytes int64
	txBytes int64
	at      time.Time
}

type MonitorService struct {
	dataDir string
	mu      sync.Mutex
	prev    map[string]monitorSnapshot
}

func NewMonitorService(dataDir string) *MonitorService {
	return &MonitorService{
		dataDir: dataDir,
		prev:    make(map[string]monitorSnapshot),
	}
}

func (s *MonitorService) GetSnapshot(ctx context.Context, serial string) (PerformanceSnapshot, error) {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return PerformanceSnapshot{}, core.NewOperationError("get_performance_snapshot", "device serial is required", "serial must not be empty", false)
	}

	snap := PerformanceSnapshot{Serial: trimmedSerial}

	snap.CPUUsage = s.fetchCPUUsage(ctx, trimmedSerial)
	snap.RAMUsage, snap.RAMUsedBytes, snap.RAMTotalBytes = s.fetchRAMUsage(ctx, trimmedSerial)
	snap.NetworkRxBytes, snap.NetworkTxBytes = s.fetchNetworkBytes(ctx, trimmedSerial)
	snap.BatteryLevel, snap.BatteryTemperatureC = s.fetchBattery(ctx, trimmedSerial)
	snap.StorageUsedBytes, snap.StorageTotalBytes = s.fetchStorage(ctx, trimmedSerial)
	snap.UptimeSeconds = s.fetchUptime(ctx, trimmedSerial)

	now := time.Now()
	s.mu.Lock()
	prev, exists := s.prev[trimmedSerial]
	if exists && now.After(prev.at) {
		elapsed := now.Sub(prev.at).Seconds()
		if elapsed > 0 {
			snap.NetworkRxSec = float64(snap.NetworkRxBytes-prev.rxBytes) / elapsed
			snap.NetworkTxSec = float64(snap.NetworkTxBytes-prev.txBytes) / elapsed
			if snap.NetworkRxSec < 0 {
				snap.NetworkRxSec = 0
			}
			if snap.NetworkTxSec < 0 {
				snap.NetworkTxSec = 0
			}
		}
	}
	s.prev[trimmedSerial] = monitorSnapshot{
		rxBytes: snap.NetworkRxBytes,
		txBytes: snap.NetworkTxBytes,
		at:      now,
	}
	s.mu.Unlock()

	return snap, nil
}

func (s *MonitorService) fetchCPUUsage(ctx context.Context, serial string) float64 {
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "top", "-bn1"},
		Timeout: 5 * time.Second,
	})
	if err != nil {
		return 0
	}

	for _, rawLine := range strings.Split(result.Stdout, "\n") {
		line := strings.ToLower(strings.TrimSpace(rawLine))
		if !strings.Contains(line, "cpu") || !strings.Contains(line, "idle") {
			continue
		}

		fields := strings.Fields(line)
		for _, field := range fields {
			if !strings.HasSuffix(field, "%idle") && !strings.Contains(field, "idle") {
				continue
			}

			valStr := strings.TrimSuffix(field, "%idle")
			valStr = strings.TrimSuffix(valStr, "idle")
			valStr = strings.TrimRight(valStr, "%")
			valStr = strings.TrimSpace(valStr)

			idleVal, parseErr := strconv.ParseFloat(valStr, 64)
			if parseErr != nil {
				continue
			}

			if idleVal > 100 {
				cores := float64(int(idleVal/100) + 1)
				return 100.0 - ((idleVal / (cores * 100.0)) * 100.0)
			}
			return 100.0 - idleVal
		}
	}

	return 0
}

func (s *MonitorService) fetchRAMUsage(ctx context.Context, serial string) (usagePercent float64, usedBytes int64, totalBytes int64) {
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "cat", "/proc/meminfo"},
		Timeout: 5 * time.Second,
	})
	if err != nil {
		return 0, 0, 0
	}

	var memTotal, memAvailable float64

	for _, rawLine := range strings.Split(result.Stdout, "\n") {
		line := strings.TrimSpace(rawLine)
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		val, parseErr := strconv.ParseFloat(fields[1], 64)
		if parseErr != nil {
			continue
		}
		switch fields[0] {
		case "MemTotal:":
			memTotal = val
		case "MemAvailable:":
			memAvailable = val
		}
	}

	if memTotal <= 0 {
		return 0, 0, 0
	}

	used := memTotal - memAvailable
	if used < 0 {
		used = 0
	}

	usagePercent = (used / memTotal) * 100
	usedBytes = int64(used * 1024)
	totalBytes = int64(memTotal * 1024)

	return usagePercent, usedBytes, totalBytes
}

func (s *MonitorService) fetchNetworkBytes(ctx context.Context, serial string) (rxBytes int64, txBytes int64) {
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "cat", "/proc/net/dev"},
		Timeout: 5 * time.Second,
	})
	if err != nil {
		return 0, 0
	}

	for _, rawLine := range strings.Split(result.Stdout, "\n") {
		line := strings.TrimSpace(rawLine)
		if !strings.Contains(line, "wlan0:") && !strings.Contains(line, "rmnet_data") {
			continue
		}

		colonIdx := strings.Index(line, ":")
		if colonIdx < 0 {
			continue
		}

		fields := strings.Fields(line[colonIdx+1:])
		if len(fields) < 9 {
			continue
		}

		rx, rxErr := strconv.ParseInt(fields[0], 10, 64)
		tx, txErr := strconv.ParseInt(fields[8], 10, 64)
		if rxErr != nil || txErr != nil {
			continue
		}

		rxBytes += rx
		txBytes += tx
	}

	return rxBytes, txBytes
}

func (s *MonitorService) fetchBattery(ctx context.Context, serial string) (level int, temperatureC float64) {
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "dumpsys", "battery"},
		Timeout: 5 * time.Second,
	})
	if err != nil {
		return 0, 0
	}

	for _, rawLine := range strings.Split(result.Stdout, "\n") {
		line := strings.TrimSpace(rawLine)
		if strings.HasPrefix(line, "level:") {
			val, parseErr := strconv.Atoi(strings.TrimSpace(strings.TrimPrefix(line, "level:")))
			if parseErr == nil {
				level = val
			}
		}
		if strings.HasPrefix(line, "temperature:") {
			val, parseErr := strconv.ParseFloat(strings.TrimSpace(strings.TrimPrefix(line, "temperature:")), 64)
			if parseErr == nil {
				temperatureC = val / 10.0
			}
		}
	}

	return level, temperatureC
}

func (s *MonitorService) fetchStorage(ctx context.Context, serial string) (usedBytes int64, totalBytes int64) {
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "df", "/data"},
		Timeout: 5 * time.Second,
	})
	if err != nil {
		return 0, 0
	}

	for _, rawLine := range strings.Split(result.Stdout, "\n") {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}
		total, totalErr := strconv.ParseInt(fields[1], 10, 64)
		used, usedErr := strconv.ParseInt(fields[2], 10, 64)
		if totalErr != nil || usedErr != nil {
			continue
		}
		return used * 1024, total * 1024
	}

	return 0, 0
}

func (s *MonitorService) fetchUptime(ctx context.Context, serial string) int64 {
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "cat", "/proc/uptime"},
		Timeout: 5 * time.Second,
	})
	if err != nil {
		return 0
	}

	fields := strings.Fields(strings.TrimSpace(result.Stdout))
	if len(fields) == 0 {
		return 0
	}

	uptimeFloat, parseErr := strconv.ParseFloat(fields[0], 64)
	if parseErr != nil {
		return 0
	}

	return int64(uptimeFloat)
}
