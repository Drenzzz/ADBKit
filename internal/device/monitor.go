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
	dataDir    string
	getBinPath func() core.BinaryPaths
	mu         sync.Mutex
	prev       map[string]monitorSnapshot
}

func NewMonitorService(dataDir string, getBinPath func() core.BinaryPaths) *MonitorService {
	return &MonitorService{
		dataDir:    dataDir,
		getBinPath: getBinPath,
		prev:       make(map[string]monitorSnapshot),
	}
}

func (s *MonitorService) GetSnapshot(ctx context.Context, serial string) (PerformanceSnapshot, error) {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return PerformanceSnapshot{}, core.NewOperationError("get_performance_snapshot", "device serial is required", "serial must not be empty", false)
	}

	snap := PerformanceSnapshot{Serial: trimmedSerial}

	// Combined adb shell command to run all checks in a single subprocess call.
	// We use ';' to ensure subsequent commands execute even if an earlier command returns an error.
	cmd := "cat /proc/stat; echo '---CPU---'; sleep 0.25; cat /proc/stat; echo '---MEM---'; cat /proc/meminfo; echo '---NET---'; cat /proc/net/dev; echo '---BATT---'; dumpsys battery; echo '---STOR---'; df /data; echo '---UPTIME---'; cat /proc/uptime"

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", trimmedSerial, "shell", cmd},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return PerformanceSnapshot{}, core.NewOperationError("get_performance_snapshot", "Failed to run combined performance commands", err.Error(), true)
	}

	stat1, stat2, mem, net, batt, stor, uptime := parseCombinedOutput(result.Stdout)

	snap.CPUUsage = s.calculateCPUUsage(stat1, stat2)
	snap.RAMUsage, snap.RAMUsedBytes, snap.RAMTotalBytes = s.parseRAMUsage(mem)
	snap.NetworkRxBytes, snap.NetworkTxBytes = s.parseNetworkBytes(net)
	snap.BatteryLevel, snap.BatteryTemperatureC = s.parseBattery(batt)
	snap.StorageUsedBytes, snap.StorageTotalBytes = s.parseStorage(stor)
	snap.UptimeSeconds = s.parseUptime(uptime)

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

// parseCombinedOutput splits combined stdout string by headers into respective command outputs
func parseCombinedOutput(stdout string) (stat1, stat2, mem, net, batt, stor, uptime string) {
	idxCPU := strings.Index(stdout, "---CPU---")
	idxMEM := strings.Index(stdout, "---MEM---")
	idxNET := strings.Index(stdout, "---NET---")
	idxBATT := strings.Index(stdout, "---BATT---")
	idxSTOR := strings.Index(stdout, "---STOR---")
	idxUPTIME := strings.Index(stdout, "---UPTIME---")

	if idxCPU != -1 {
		stat1 = stdout[:idxCPU]
	} else {
		stat1 = stdout
	}

	if idxCPU != -1 {
		start := idxCPU + len("---CPU---")
		if idxMEM != -1 {
			stat2 = stdout[start:idxMEM]
		} else {
			stat2 = stdout[start:]
		}
	}

	if idxMEM != -1 {
		start := idxMEM + len("---MEM---")
		if idxNET != -1 {
			mem = stdout[start:idxNET]
		} else {
			mem = stdout[start:]
		}
	}

	if idxNET != -1 {
		start := idxNET + len("---NET---")
		if idxBATT != -1 {
			net = stdout[start:idxBATT]
		} else {
			net = stdout[start:]
		}
	}

	if idxBATT != -1 {
		start := idxBATT + len("---BATT---")
		if idxSTOR != -1 {
			batt = stdout[start:idxSTOR]
		} else {
			batt = stdout[start:]
		}
	}

	if idxSTOR != -1 {
		start := idxSTOR + len("---STOR---")
		if idxUPTIME != -1 {
			stor = stdout[start:idxUPTIME]
		} else {
			stor = stdout[start:]
		}
	}

	if idxUPTIME != -1 {
		uptime = stdout[idxUPTIME+len("---UPTIME---"):]
	}

	return
}

func (s *MonitorService) calculateCPUUsage(stat1, stat2 string) float64 {
	first, ok := s.parseCPUStat(stat1)
	if !ok {
		return 0
	}

	second, ok := s.parseCPUStat(stat2)
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

func (s *MonitorService) parseCPUStat(output string) (cpuStat, bool) {
	for _, rawLine := range strings.Split(output, "\n") {
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

func (s *MonitorService) parseRAMUsage(output string) (usagePercent float64, usedBytes int64, totalBytes int64) {
	var memTotal, memAvailable float64

	for _, rawLine := range strings.Split(output, "\n") {
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

func (s *MonitorService) parseNetworkBytes(output string) (rxBytes int64, txBytes int64) {
	for _, rawLine := range strings.Split(output, "\n") {
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

func (s *MonitorService) parseBattery(output string) (level int, temperatureC float64) {
	for _, rawLine := range strings.Split(output, "\n") {
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

func (s *MonitorService) parseStorage(output string) (usedBytes int64, totalBytes int64) {
	for _, rawLine := range strings.Split(output, "\n") {
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

func (s *MonitorService) parseUptime(output string) int64 {
	fields := strings.Fields(strings.TrimSpace(output))
	if len(fields) == 0 {
		return 0
	}

	uptimeFloat, parseErr := strconv.ParseFloat(fields[0], 64)
	if parseErr != nil {
		return 0
	}

	return int64(uptimeFloat)
}
