package main

import (
	"os"
	"path/filepath"
)

// WriteFileAtomic writes data to a file atomically by writing to a temp file
// then renaming. Prevents partial writes on crash.
func WriteFileAtomic(path string, data []byte) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return NewOperationError("fsutil", "failed to create directory", err.Error(), true)
	}

	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return NewOperationError("fsutil", "failed to write temp file", err.Error(), true)
	}

	if err := os.Rename(tmp, path); err != nil {
		os.Remove(tmp)
		return NewOperationError("fsutil", "failed to rename temp file", err.Error(), true)
	}

	return nil
}
