package backend

import (
	"strings"
	"time"
)

type CommandLogEntry struct {
	ID        int64  `json:"id"`
	Timestamp string `json:"timestamp"`
	Serial    string `json:"serial"`
	Mode      string `json:"mode"`
	Command   string `json:"command"`
	Duration  int64  `json:"durationMs"`
	Status    string `json:"status"`
	Output    string `json:"outputPreview"`
}

func (a *App) logCommand(binaryName string, args []string, duration time.Duration, err error, output string) {
	a.commandLogMutex.Lock()
	defer a.commandLogMutex.Unlock()

	serial := ""
	mode := binaryName
	commandParts := []string{binaryName}
	commandParts = append(commandParts, args...)

	// Extract serial if it exists (e.g., adb -s 1234 shell)
	for i := 0; i < len(args)-1; i++ {
		if args[i] == "-s" {
			serial = args[i+1]
			break
		}
	}

	status := "OK"
	if err != nil {
		status = "FAILED"
		errStr := err.Error()
		if strings.Contains(errStr, "timeout") {
			status = "TIMEOUT"
		} else if strings.Contains(errStr, "cancelled") {
			status = "CANCELLED"
		}
	}

	outPreview := strings.TrimSpace(output)
	if len(outPreview) > 200 {
		outPreview = outPreview[:200] + "..."
	}

	entry := CommandLogEntry{
		ID:        time.Now().UnixNano(),
		Timestamp: time.Now().Format(time.RFC3339),
		Serial:    serial,
		Mode:      mode,
		Command:   strings.Join(commandParts, " "),
		Duration:  duration.Milliseconds(),
		Status:    status,
		Output:    outPreview,
	}

	a.commandLogs = append(a.commandLogs, entry)

	// Keep last 1000 logs
	if len(a.commandLogs) > 1000 {
		a.commandLogs = a.commandLogs[1:]
	}
}

func (a *App) GetCommandHistory(serial string, limit int) ([]CommandLogEntry, error) {
	a.commandLogMutex.RLock()
	defer a.commandLogMutex.RUnlock()

	var result []CommandLogEntry
	for i := len(a.commandLogs) - 1; i >= 0; i-- {
		log := a.commandLogs[i]
		if serial == "" || log.Serial == serial {
			result = append(result, log)
		}
		if limit > 0 && len(result) >= limit {
			break
		}
	}

	return result, nil
}
