//go:build windows

package core

import "context"

// runWithPTY is unsupported on Windows; callers fall back to pipe streaming.
func runWithPTY(_ context.Context, _ string, _ []string, _ func(line string)) (*ExecResult, error) {
	return nil, errPTYUnsupported
}
