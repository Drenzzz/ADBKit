package backend

import (
	"errors"
	"strings"
	"testing"
	"time"
)

func TestQuoteShellArgEscapesSingleQuote(t *testing.T) {
	input := "/sdcard/My Folder/O'Reilly"
	quoted := quoteShellArg(input)

	expected := "'/sdcard/My Folder/O'\"'\"'Reilly'"
	if quoted != expected {
		t.Fatalf("unexpected quote result. expected %s, got %s", expected, quoted)
	}
}

func TestIsTransientTransferError(t *testing.T) {
	cases := []struct {
		name     string
		err      error
		expected bool
	}{
		{name: "offline is transient", err: errors.New("device offline"), expected: true},
		{name: "reset is transient", err: errors.New("read tcp: connection reset by peer"), expected: true},
		{name: "cancelled is not transient", err: errors.New("pull cancelled by user"), expected: false},
		{name: "permission denied is not transient", err: errors.New("Permission denied"), expected: false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := isTransientTransferError(tc.err); got != tc.expected {
				t.Fatalf("expected %v, got %v", tc.expected, got)
			}
		})
	}
}

func TestRunTransferWithRetry(t *testing.T) {
	app := NewApp()
	originalAttempts := transferRetryAttempts
	originalDelay := transferRetryDelay
	transferRetryAttempts = 3
	transferRetryDelay = 1 * time.Millisecond
	defer func() {
		transferRetryAttempts = originalAttempts
		transferRetryDelay = originalDelay
	}()

	attempts := 0
	output, err := app.runTransferWithRetry(t.Context(), func() (string, error) {
		attempts++
		if attempts < 3 {
			return "", errors.New("device offline")
		}
		return "ok", nil
	})

	if err != nil {
		t.Fatalf("expected retry to recover, got error: %v", err)
	}
	if output != "ok" {
		t.Fatalf("expected output ok, got %s", output)
	}
	if attempts != 3 {
		t.Fatalf("expected 3 attempts, got %d", attempts)
	}
}

func TestFormatTransferBatchSummaryIncludesSucceededAndFailed(t *testing.T) {
	summary := formatTransferBatchSummary(
		"/tmp/export",
		[]string{"photo.jpg", "Movies"},
		[]batchTransferFailure{{Path: "archive.zip", Reason: "permission denied"}},
	)

	if !strings.Contains(summary, "2/3 succeeded, 1 failed") {
		t.Fatalf("summary should include totals, got: %s", summary)
	}
	if !strings.Contains(summary, "Succeeded items:") || !strings.Contains(summary, "photo.jpg") {
		t.Fatalf("summary should include succeeded items, got: %s", summary)
	}
	if !strings.Contains(summary, "Failed items:") || !strings.Contains(summary, "archive.zip: permission denied") {
		t.Fatalf("summary should include failed items, got: %s", summary)
	}
}
