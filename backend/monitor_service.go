package backend

import (
	"fmt"
	"strconv"
	"strings"
)

func (a *App) GetPerformanceSnapshot(serial string) (PerformanceSnapshot, error) {
	if serial == "" {
		return PerformanceSnapshot{}, fmt.Errorf("serial cannot be empty")
	}

	snap := PerformanceSnapshot{}

	// RAM
	memOutput, err := a.runCommand("adb", "-s", serial, "shell", "cat /proc/meminfo")
	if err == nil {
		lines := strings.Split(memOutput, "\n")
		var memTotal, memFree, memAvailable, buffers, cached float64
		for _, line := range lines {
			parts := strings.Fields(line)
			if len(parts) < 2 {
				continue
			}
			val, _ := strconv.ParseFloat(parts[1], 64)
			
			switch parts[0] {
			case "MemTotal:":
				memTotal = val
			case "MemFree:":
				memFree = val
			case "MemAvailable:":
				memAvailable = val
			case "Buffers:":
				buffers = val
			case "Cached:":
				cached = val
			}
		}

		if memTotal > 0 {
			// If MemAvailable exists (Android 3.14+ kernel), use it for better accuracy
			// Otherwise calculate used as Total - Free - Buffers - Cached
			used := 0.0
			if memAvailable > 0 {
				used = memTotal - memAvailable
			} else {
				used = memTotal - memFree - buffers - cached
			}
			
			if used < 0 { used = 0 }
			snap.RAMUsage = (used / memTotal) * 100
		}
	}

	// CPU (using top -n 1 for quick snapshot)
	cpuOutput, err := a.runCommand("adb", "-s", serial, "shell", "top -n 1 -m 1")
	if err == nil {
		lines := strings.Split(cpuOutput, "\n")
		// Android 'top' output formats vary wildly between versions
		// Typical Android 8+ format:
		// 800%cpu  32%user   6%nice  48%sys 707%idle   0%iow   6%irq   1%sirq   0%host
		// Typical Android 7- format:
		// User 2%, System 3%, IOW 0%, IRQ 0%
		for _, line := range lines {
			lineLower := strings.ToLower(line)
			if strings.Contains(lineLower, "user") && strings.Contains(lineLower, "sys") {
				// We found the CPU line. Since parsing all formats is tricky, 
				// we'll look for "idle" and subtract from 100% (or equivalent)
				if strings.Contains(lineLower, "idle") {
					parts := strings.Fields(lineLower)
					for _, p := range parts {
						if strings.HasSuffix(p, "%idle") || strings.HasSuffix(p, "idle") {
							valStr := strings.TrimRight(p, "%idle")
							valStr = strings.TrimSpace(valStr)
							idleVal, err := strconv.ParseFloat(valStr, 64)
							if err == nil {
								// Sometimes top shows total > 100% (e.g. 800% for 8 cores)
								// If idle is > 100, we probably need to scale it down
								if idleVal > 100 {
									// Rough heuristic: find how many 100s fit
									cores := float64(int(idleVal/100) + 1)
									snap.CPUUsage = 100.0 - ((idleVal / (cores * 100.0)) * 100.0)
								} else {
									snap.CPUUsage = 100.0 - idleVal
								}
								break
							}
						}
					}
				}
				break
			}
		}
	}

	// For network speed, it requires two snapshots to measure delta Rx/Tx bytes.
	// Since this is a single snapshot endpoint, the frontend needs to handle the delta.
	// We'll return the absolute byte values right now inside these fields.
	netOutput, err := a.runCommand("adb", "-s", serial, "shell", "cat /proc/net/dev")
	if err == nil {
		var rxTotal, txTotal float64
		lines := strings.Split(netOutput, "\n")
		for _, line := range lines {
			if strings.Contains(line, "wlan0:") || strings.Contains(line, "rmnet_data") {
				parts := strings.Fields(line)
				if len(parts) >= 10 {
					rxStr := parts[1] // if interface name is attached without space: "wlan0:1234", handled by fields?
					if strings.Contains(parts[0], ":") && len(parts[0]) > strings.Index(parts[0], ":")+1 {
						// wlan0:1234
						rxStr = parts[0][strings.Index(parts[0], ":")+1:]
					}
					
					rx, _ := strconv.ParseFloat(rxStr, 64)
					
					txIdx := 9
					if strings.HasSuffix(parts[0], ":") { txIdx = 9 } else { txIdx = 8 }
					
					if len(parts) > txIdx {
						tx, _ := strconv.ParseFloat(parts[txIdx], 64)
						rxTotal += rx
						txTotal += tx
					}
				}
			}
		}
		snap.NetworkRxSec = rxTotal
		snap.NetworkTxSec = txTotal
	}

	return snap, nil
}
