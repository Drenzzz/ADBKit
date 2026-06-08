package audit

import (
	"ADBKit/internal/core"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sync"
	"sync/atomic"
	"time"
)

var sensitivePathPattern = regexp.MustCompile(`(?i)([A-Z]:\\[^\s|]+|/(?:home|users|tmp|var|opt|usr|mnt|media)/[^\s|]+)`)

type LogLevel string

const (
	LogLevelInfo    LogLevel = "info"
	LogLevelWarning LogLevel = "warning"
	LogLevelError   LogLevel = "error"
	LogLevelDebug   LogLevel = "debug"
	LogLevelSuccess LogLevel = "success"
)

type Entry struct {
	ID        int64     `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Level     LogLevel  `json:"level"`
	Operation string    `json:"operation"`
	Message   string    `json:"message"`
	Details   string    `json:"details,omitempty"`
	Duration  string    `json:"duration,omitempty"`
	Success   bool      `json:"success"`
}

type Log struct {
	mu          sync.Mutex
	idCounter   int64
	entries     []Entry
	path        string
	maxEntries  int
	saveMu      sync.Mutex
	savePending bool
}

const (
	defaultMaxEntries = 1000
	saveDebounce      = 500 * time.Millisecond
)

func New(dataDir string) (*Log, error) {
	if err := os.MkdirAll(dataDir, 0o700); err != nil {
		return nil, err
	}

	logPath := filepath.Join(dataDir, "audit.json")

	entries := make([]Entry, 0)
	if _, err := os.Stat(logPath); err == nil {
		data, err := os.ReadFile(logPath)
		if err == nil {
			_ = json.Unmarshal(data, &entries)
		}
	}

	return &Log{
		entries:    entries,
		path:       logPath,
		maxEntries: defaultMaxEntries,
		idCounter:  time.Now().UnixNano(),
	}, nil
}

func (l *Log) Log(level LogLevel, operation, message string) {
	l.append(level, operation, message, "", "", level == LogLevelInfo || level == LogLevelSuccess)
}

func (l *Log) LogWithDetails(level LogLevel, operation, message, details string) {
	l.append(level, operation, message, RedactAuditDetails(details), "", level == LogLevelInfo || level == LogLevelSuccess)
}

func (l *Log) LogOperation(operation, message string, duration string, success bool) {
	l.LogOperationWithDetails(operation, message, "", duration, success)
}

func (l *Log) LogOperationWithDetails(operation, message, details, duration string, success bool) {
	level := LogLevelInfo
	if !success {
		level = LogLevelError
	}
	l.append(level, operation, message, RedactAuditDetails(details), duration, success)
}

func (l *Log) append(level LogLevel, operation, message, details, duration string, success bool) {
	id := atomic.AddInt64(&l.idCounter, 1)

	entry := Entry{
		ID:        id,
		Timestamp: time.Now(),
		Level:     level,
		Operation: operation,
		Message:   message,
		Details:   details,
		Duration:  duration,
		Success:   success,
	}

	l.mu.Lock()
	l.entries = append(l.entries, entry)
	if len(l.entries) > l.maxEntries {
		l.entries = l.entries[len(l.entries)-l.maxEntries:]
	}
	l.mu.Unlock()

	l.scheduleSave()
}

func (l *Log) Entries() []Entry {
	l.mu.Lock()
	defer l.mu.Unlock()

	out := make([]Entry, len(l.entries))
	copy(out, l.entries)
	return out
}

func (l *Log) Clear() {
	l.mu.Lock()
	l.entries = make([]Entry, 0)
	l.mu.Unlock()

	l.saveNow()
}

func (l *Log) scheduleSave() {
	l.saveMu.Lock()
	if l.savePending {
		l.saveMu.Unlock()
		return
	}
	l.savePending = true
	l.saveMu.Unlock()

	go func() {
		time.Sleep(saveDebounce)
		l.saveNow()
	}()
}

func (l *Log) saveNow() {
	l.saveMu.Lock()
	l.savePending = false
	l.saveMu.Unlock()

	l.mu.Lock()
	snapshot := make([]Entry, len(l.entries))
	copy(snapshot, l.entries)
	l.mu.Unlock()

	data, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "audit log marshal error: %v\n", err)
		return
	}

	if err := core.WriteFileAtomicWithMode(l.path, data, 0o600); err != nil {
		fmt.Fprintf(os.Stderr, "audit log write error: %v\n", err)
	}
}

func RedactAuditDetails(details string) string {
	return sensitivePathPattern.ReplaceAllString(details, "[redacted-path]")
}
