package audit

import (
	"ADBKit/internal/core"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Entry represents a single logged operation.
type Entry struct {
	ID        string    `json:"id"`
	Operation string    `json:"operation"`
	Command   string    `json:"command,omitempty"`
	Args      []string  `json:"args,omitempty"`
	ExitCode  int       `json:"exitCode"`
	Success   bool      `json:"success"`
	Duration  int64     `json:"durationMs"`
	Error     string    `json:"error,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// Log manages a persistent log of operations.
type Log struct {
	mu      sync.Mutex
	entries []Entry
	path    string
}

// New creates or loads an audit log from the given directory.
func New(dataDir string) (*Log, error) {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, err
	}

	path := filepath.Join(dataDir, "audit.json")
	al := &Log{
		entries: make([]Entry, 0),
		path:    path,
	}

	data, err := os.ReadFile(path)
	if err == nil {
		_ = json.Unmarshal(data, &al.entries)
	}

	return al, nil
}

// Log appends a new entry and persists to disk.
func (al *Log) Log(entry Entry) error {
	al.mu.Lock()
	defer al.mu.Unlock()

	entry.Timestamp = time.Now()
	al.entries = append(al.entries, entry)

	return al.persist()
}

// Entries returns a copy of all log entries.
func (al *Log) Entries() []Entry {
	al.mu.Lock()
	defer al.mu.Unlock()

	out := make([]Entry, len(al.entries))
	copy(out, al.entries)
	return out
}

// Clear removes all entries and persists the empty log.
func (al *Log) Clear() error {
	al.mu.Lock()
	defer al.mu.Unlock()

	al.entries = make([]Entry, 0)
	return al.persist()
}

func (al *Log) persist() error {
	data, err := json.MarshalIndent(al.entries, "", "  ")
	if err != nil {
		return core.NewOperationError("audit", "failed to marshal log", err.Error(), true)
	}
	return core.WriteFileAtomic(al.path, data)
}
