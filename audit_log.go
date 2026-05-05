package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// AuditEntry represents a single logged operation.
type AuditEntry struct {
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

// AuditLog manages a persistent log of operations.
type AuditLog struct {
	mu      sync.Mutex
	entries []AuditEntry
	path    string
}

// NewAuditLog creates or loads an audit log from the given path.
func NewAuditLog(dataDir string) (*AuditLog, error) {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, err
	}

	path := filepath.Join(dataDir, "audit.json")
	al := &AuditLog{
		entries: make([]AuditEntry, 0),
		path:    path,
	}

	data, err := os.ReadFile(path)
	if err == nil {
		_ = json.Unmarshal(data, &al.entries)
	}

	return al, nil
}

// Log appends a new entry and persists to disk.
func (al *AuditLog) Log(entry AuditEntry) error {
	al.mu.Lock()
	defer al.mu.Unlock()

	entry.Timestamp = time.Now()
	al.entries = append(al.entries, entry)

	return al.persist()
}

// Entries returns a copy of all log entries.
func (al *AuditLog) Entries() []AuditEntry {
	al.mu.Lock()
	defer al.mu.Unlock()

	out := make([]AuditEntry, len(al.entries))
	copy(out, al.entries)
	return out
}

// Clear removes all entries and persists the empty log.
func (al *AuditLog) Clear() error {
	al.mu.Lock()
	defer al.mu.Unlock()

	al.entries = make([]AuditEntry, 0)
	return al.persist()
}

func (al *AuditLog) persist() error {
	data, err := json.MarshalIndent(al.entries, "", "  ")
	if err != nil {
		return NewOperationError("audit", "failed to marshal log", err.Error(), true)
	}
	return WriteFileAtomic(al.path, data)
}
