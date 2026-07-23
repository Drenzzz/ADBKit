package core

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"io"
	"os/exec"
	"sync"
	"time"
)

// ExecRequest defines the input for a process execution.
type ExecRequest struct {
	Command string
	Args    []string
	Timeout time.Duration
}

// ExecResult holds the output of a process execution.
type ExecResult struct {
	Stdout   string        `json:"stdout"`
	Stderr   string        `json:"stderr"`
	ExitCode int           `json:"exitCode"`
	Duration time.Duration `json:"duration"`
}

// RunCommand executes a process with optional timeout and captures stdout/stderr.
func RunCommand(ctx context.Context, req ExecRequest) (*ExecResult, error) {
	if req.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, req.Timeout)
		defer cancel()
	}

	cmd := exec.CommandContext(ctx, req.Command, req.Args...)
	ConfigureChildProcess(cmd)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	start := time.Now()
	err := cmd.Run()
	duration := time.Since(start)

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, NewOperationError("exec", "failed to start process", err.Error(), true)
		}
	}

	result := &ExecResult{
		Stdout:   stdout.String(),
		Stderr:   stderr.String(),
		ExitCode: exitCode,
		Duration: duration,
	}
	return result, err
}

// RunCommandWithStdin executes a process that receives input via stdin.
func RunCommandWithStdin(ctx context.Context, req ExecRequest, stdin string) (*ExecResult, error) {
	if req.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, req.Timeout)
		defer cancel()
	}

	cmd := exec.CommandContext(ctx, req.Command, req.Args...)
	ConfigureChildProcess(cmd)
	cmd.Stdin = bytes.NewBufferString(stdin)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	start := time.Now()
	err := cmd.Run()
	duration := time.Since(start)

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, NewOperationError("exec", "failed to start process", err.Error(), true)
		}
	}

	result := &ExecResult{
		Stdout:   stdout.String(),
		Stderr:   stderr.String(),
		ExitCode: exitCode,
		Duration: duration,
	}
	return result, err
}

// StreamingExecRequest extends ExecRequest with a line-level progress callback.
type StreamingExecRequest struct {
	Command      string
	Args         []string
	Timeout      time.Duration
	OnStderrLine func(line string)
}

// scanProgressLines splits on both \n and \r so that adb's carriage-return
// driven progress updates are emitted as individual tokens.
func scanProgressLines(data []byte, atEOF bool) (advance int, token []byte, err error) {
	if atEOF && len(data) == 0 {
		return 0, nil, nil
	}
	for i, b := range data {
		if b == '\n' || b == '\r' {
			return i + 1, data[:i], nil
		}
	}
	if atEOF {
		return len(data), data, nil
	}
	return 0, nil, nil
}

// errPTYUnsupported signals that PTY-backed execution is unavailable and the
// caller should fall back to pipe streaming.
var errPTYUnsupported = errors.New("pty unsupported on this platform")

// RunCommandStreaming starts a process and streams output line-by-line via
// callback. It prefers a PTY so adb emits interactive progress; on platforms
// where PTY is unavailable it falls back to dual-pipe streaming.
func RunCommandStreaming(ctx context.Context, req StreamingExecRequest) (*ExecResult, error) {
	if req.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, req.Timeout)
		defer cancel()
	}

	if result, err := runWithPTY(ctx, req.Command, req.Args, req.OnStderrLine); err == nil {
		return result, nil
	} else if !errors.Is(err, errPTYUnsupported) {
		return result, err
	}

	cmd := exec.CommandContext(ctx, req.Command, req.Args...)
	ConfigureChildProcess(cmd)

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, NewOperationError("exec", "failed to create stdout pipe", err.Error(), true)
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return nil, NewOperationError("exec", "failed to create stderr pipe", err.Error(), true)
	}

	if err := cmd.Start(); err != nil {
		return nil, NewOperationError("exec", "failed to start process", err.Error(), true)
	}

	var stdoutBuf bytes.Buffer
	var bufMu sync.Mutex
	var wg sync.WaitGroup

	scan := func(r io.Reader, capture bool) {
		defer wg.Done()
		scanner := bufio.NewScanner(r)
		scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
		scanner.Split(scanProgressLines)
		for scanner.Scan() {
			line := scanner.Text()
			if capture && line != "" {
				bufMu.Lock()
				stdoutBuf.WriteString(line)
				stdoutBuf.WriteByte('\n')
				bufMu.Unlock()
			}
			if req.OnStderrLine != nil {
				req.OnStderrLine(line)
			}
		}
	}

	wg.Add(2)
	go scan(stdoutPipe, true)
	go scan(stderrPipe, false)

	waitErr := cmd.Wait()
	wg.Wait()
	if ctx.Err() != nil {
		return nil, ctx.Err()
	}

	exitCode := 0
	if waitErr != nil {
		if exitErr, ok := waitErr.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, NewOperationError("exec", "process wait failed", waitErr.Error(), true)
		}
	}

	result := &ExecResult{
		Stdout:   stdoutBuf.String(),
		ExitCode: exitCode,
	}
	return result, waitErr
}
