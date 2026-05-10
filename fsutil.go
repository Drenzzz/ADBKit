package main

import (
	"os"
	"path/filepath"
)

func WriteFileAtomic(path string, data []byte) error {
	return WriteFileAtomicWithMode(path, data, 0o644)
}

func WriteFileAtomicWithMode(path string, data []byte, mode os.FileMode) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return NewOperationError("fsutil", "failed to create directory", err.Error(), true)
	}

	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, mode); err != nil {
		return NewOperationError("fsutil", "failed to write temp file", err.Error(), true)
	}

	if err := os.Rename(tmp, path); err != nil {
		os.Remove(tmp)
		return NewOperationError("fsutil", "failed to rename temp file", err.Error(), true)
	}

	return nil
}
