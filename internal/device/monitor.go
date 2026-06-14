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

// fetchCPUUsage membaca /proc/stat dua kali dengan jeda singkat lalu menghitung
// utilisasi dari delta idle terhadap total. Pendekatan ini akurat lintas device
// dan tidak bergantung pada format output `top` yang berbeda antar toolbox.
func (s *MonitorService) fetchCPUUsage(ctx context.Context, serial string) float64 {
	first, ok := s.readCPUStat(ctx, serial)
	if !ok {
		return 0
	}

	select {
	case <-ctx.Done():
		return 0
	case <-time.After(400 * time.Millisecond):
	}

	second, ok := s.readCPUStat(ctx, serial)
	if !ok {
		return 0
	}

	totalDelta := float64(second.total - first.total)
	idleDelta := float64(second.idle - first.idle)
	if totalDelta <= 0 {
		return 0
	}

	usage := (1.0 - idleDelta/totalDelta) * 100.0
	if usage < 0 {
		return 0
	}
	if usage > 100 {
		return 100
	}
	return usage
}

type cpuStat struct {
	total int64
	idle  int64
}

func (s *MonitorService) readCPUStat(ctx context.Context, serial string) (cpuStat, bool) {
	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    []string{"-s", serial, "shell", "cat", "/proc/stat"},
		Timeout: 5 * time.Second,
	})
	if err != nil {
		return cpuStat{}, false
	}

	for _, rawLine := range strings.Split(result.Stdout, "\n") {
		fields := strings.Fields(strings.TrimSpace(rawLine))
		if len(fields) < 5 || fields[0] != "cpu" {
			continue
		}

		var total int64
		var idle int64
		// Kolom /proc/stat: user nice system idle iowait irq softirq steal ...
		// idle = field index 4 (idle) + 5 (iowait) bila tersedia.
		for i, field := range fields[1:] {
			val, parseErr := strconv.ParseInt(field, 10, 64)
			if parseErr != nil {
				continue
			}
			total += val
			if i == 3 || i == 4 {
				idle += val
			}
		}
		if total <= 0 {
			return cpuStat{}, false
		}
		return cpuStat{total: total, idle: idle}, true
	}

	return cpuStat{}, false
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
		colonIdx := strings.Index(line, ":")
		if colonIdx < 0 {
			continue
		}

		iface := strings.TrimSpace(line[:colonIdx])
		if !isMeteredInterface(iface) {
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

// isMeteredInterface mencakup Wi-Fi, ethernet, dan mobile data dengan penamaan
// yang beragam antar device, sambil mengabaikan loopback dan virtual interface.
func isMeteredInterface(iface string) bool {
	if iface == "" || iface == "lo" {
		return false
	}
	prefixes := []string{"wlan", "eth", "rmnet", "ccmni", "rmnet_data", "wwan", "usb"}
	for _, prefix := range prefixes {
		if strings.HasPrefix(iface, prefix) {
			return true
		}
	}
	return false
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
