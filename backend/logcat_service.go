package backend

import (
	"bufio"
	"context"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"os/exec"
	"strings"
	"sync"
)

type LogcatStream struct {
	ID        string
	ctx       context.Context
	cancel    context.CancelFunc
	cmd       *exec.Cmd
	isRunning bool
	mutex     sync.Mutex
}

var (
	activeStreams      = make(map[string]*LogcatStream)
	activeStreamsMutex sync.Mutex
)

// StartLogcat starts a logcat process for a specific device and streams the output via Wails events.
func (a *App) StartLogcat(serial string, filters string) error {
	if serial == "" {
		return fmt.Errorf("device serial cannot be empty")
	}

	activeStreamsMutex.Lock()
	if _, exists := activeStreams[serial]; exists {
		activeStreamsMutex.Unlock()
		return fmt.Errorf("logcat stream already running for device %s", serial)
	}
	activeStreamsMutex.Unlock()

	binaryPath, err := a.getBinaryPath("adb")
	if err != nil {
		return err
	}

	// Prepare arguments: adb -s <serial> logcat [filters]
	args := []string{"-s", serial, "logcat"}
	if filters != "" {
		filterArgs := strings.Fields(filters)
		args = append(args, filterArgs...)
	}

	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(ctx, binaryPath, args...)
	setCommandWindowMode(cmd)

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		return fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	stream := &LogcatStream{
		ID:        serial,
		ctx:       ctx,
		cancel:    cancel,
		cmd:       cmd,
		isRunning: true,
	}

	activeStreamsMutex.Lock()
	activeStreams[serial] = stream
	activeStreamsMutex.Unlock()

	err = cmd.Start()
	if err != nil {
		stream.cancel()
		activeStreamsMutex.Lock()
		delete(activeStreams, serial)
		activeStreamsMutex.Unlock()
		return fmt.Errorf("failed to start logcat: %w", err)
	}

	a.logCommand("adb", args, 0, nil, fmt.Sprintf("Started streaming logcat for %s", serial))

	// Read stdout asynchronously
	go func() {
		scanner := bufio.NewScanner(stdoutPipe)
		for scanner.Scan() {
			line := scanner.Text()
			// Emit event to frontend
			runtime.EventsEmit(a.ctx, "logcat_line", map[string]string{
				"serial": serial,
				"line":   line,
			})
		}
	}()

	// Read stderr asynchronously
	go func() {
		scanner := bufio.NewScanner(stderrPipe)
		for scanner.Scan() {
			line := scanner.Text()
			runtime.EventsEmit(a.ctx, "logcat_error", map[string]string{
				"serial": serial,
				"line":   line,
			})
		}
	}()

	// Monitor process completion
	go func() {
		err := cmd.Wait()

		stream.mutex.Lock()
		stream.isRunning = false
		stream.mutex.Unlock()

		activeStreamsMutex.Lock()
		delete(activeStreams, serial)
		activeStreamsMutex.Unlock()

		status := "stopped"
		if err != nil && ctx.Err() != context.Canceled {
			status = "error"
		}

		runtime.EventsEmit(a.ctx, "logcat_status", map[string]string{
			"serial": serial,
			"status": status,
		})
	}()

	return nil
}

// StopLogcat stops an active logcat stream
func (a *App) StopLogcat(serial string) error {
	activeStreamsMutex.Lock()
	stream, exists := activeStreams[serial]
	activeStreamsMutex.Unlock()

	if !exists {
		return fmt.Errorf("no active logcat stream for device %s", serial)
	}

	stream.mutex.Lock()
	defer stream.mutex.Unlock()

	if stream.isRunning {
		stream.cancel()
		stream.isRunning = false
		a.logCommand("adb", []string{"-s", serial, "logcat"}, 0, nil, fmt.Sprintf("Stopped logcat for %s", serial))
		return nil
	}

	return fmt.Errorf("stream already stopped")
}
