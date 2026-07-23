package core

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestRunCommandPropagatesExitFailure(t *testing.T) {
	if os.Args[len(os.Args)-1] == "exit-7" {
		os.Exit(7)
	}

	result, err := RunCommand(context.Background(), ExecRequest{
		Command: os.Args[0],
		Args:    []string{"-test.run=TestRunCommandPropagatesExitFailure", "--", "exit-7"},
	})
	if err == nil {
		t.Fatal("expected non-zero exit to return an error")
	}
	if result == nil || result.ExitCode != 7 {
		t.Fatalf("expected exit code 7, got %#v", result)
	}
}

func TestRunCommandStreamingPropagatesExitFailure(t *testing.T) {
	result, err := RunCommandStreaming(context.Background(), StreamingExecRequest{
		Command: os.Args[0],
		Args:    []string{"-test.run=TestRunCommandPropagatesExitFailure", "--", "exit-7"},
	})
	if err == nil {
		t.Fatal("expected non-zero exit to return an error")
	}
	if result == nil || result.ExitCode != 7 {
		t.Fatalf("expected exit code 7, got %#v", result)
	}
}

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
