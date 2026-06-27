package core

import (
	"context"
	"testing"
	"time"
)

func TestRunCommandStreaming_Timeout(t *testing.T) {
	ctx := context.Background()
	req := StreamingExecRequest{
		Command: "sleep",
		Args:    []string{"10"},
		Timeout: 100 * time.Millisecond,
	}

	start := time.Now()
	_, err := RunCommandStreaming(ctx, req)
	duration := time.Since(start)

	if err == nil {
		t.Fatal("expected timeout error, got nil")
	}

	// Verify it actually timed out quickly and didn't sleep for 10 seconds
	if duration >= 5*time.Second {
		t.Fatalf("command took too long: %v, expected timeout around 100ms", duration)
	}
}
