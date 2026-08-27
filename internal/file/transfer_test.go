package file

import (
	"ADBKit/internal/core"
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestPushMultipleFiles_CancelledReturnsError(t *testing.T) {
	tests := []struct {
		name          string
		cancelOnCall  int
		includeBroken bool
	}{
		{name: "first file", cancelOnCall: 1},
		{name: "after previous file", cancelOnCall: 2, includeBroken: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			validPath := filepath.Join(dir, "valid.txt")
			if err := os.WriteFile(validPath, []byte("test"), 0o600); err != nil {
				t.Fatalf("write test file: %v", err)
			}

			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			calls := 0
			svc := &Service{
				resolveActiveSerial: func(context.Context) (string, error) {
					calls++
					if calls == tt.cancelOnCall {
						cancel()
					}
					return "test-device", nil
				},
				getBinPath: func() core.BinaryPaths {
					return core.BinaryPaths{Adb: "adb"}
				},
			}

			paths := []string{validPath}
			if tt.includeBroken {
				paths = []string{filepath.Join(dir, "missing.txt"), validPath}
			}

			_, err := svc.PushMultipleFiles(ctx, paths, "/sdcard")
			if err == nil {
				t.Fatal("expected cancelled push batch to return an error")
			}

			var operationErr *core.OperationError
			if !errors.As(err, &operationErr) {
				t.Fatalf("expected OperationError, got %T: %v", err, err)
			}
			if operationErr.Operation != "push_multiple_files" {
				t.Errorf("operation = %q, want push_multiple_files", operationErr.Operation)
			}
			if operationErr.Message != "Push batch cancelled" {
				t.Errorf("message = %q, want Push batch cancelled", operationErr.Message)
			}
		})
	}
}
