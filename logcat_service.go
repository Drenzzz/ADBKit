package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os/exec"
	"regexp"
	"strings"
	"sync"

	"github.com/google/uuid"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	LogcatEventLine   = "logcat_line"
	LogcatEventStatus = "logcat_status"
)

var logcatPattern = regexp.MustCompile(`^(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(.+?):\s?(.*)$`)

type LogcatEntry struct {
	ID        string `json:"id"`
	Serial    string `json:"serial"`
	Date      string `json:"date"`
	Time      string `json:"time"`
	PID       string `json:"pid"`
	TID       string `json:"tid"`
	Level     string `json:"level"`
	Tag       string `json:"tag"`
	Message   string `json:"message"`
	Raw       string `json:"raw"`
	Timestamp string `json:"timestamp"`
}

type LogcatStatusEvent struct {
	Serial string `json:"serial"`
	Status string `json:"status"`
}

type logcatStream struct {
	serial string
	cmd    *exec.Cmd
	stdout io.ReadCloser
	stderr io.ReadCloser
	once   sync.Once
}

type LogcatService struct {
	ctx           context.Context
	binaryService *BinaryService

	mu      sync.Mutex
	streams map[string]*logcatStream
}

func NewLogcatService(ctx context.Context, binaryService *BinaryService) *LogcatService {
	return &LogcatService{
		ctx:           ctx,
		binaryService: binaryService,
		streams:       make(map[string]*logcatStream),
	}
}

func (s *LogcatService) StartStream(ctx context.Context, serial string, levels string, tagFilter string) error {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return NewOperationError(
			"start_logcat_stream",
			"Device serial is required",
			"serial must not be empty",
			false,
		)
	}

	adbPath, err := s.resolveADBPath()
	if err != nil {
		return err
	}

	if s.hasStream(trimmedSerial) {
		if err := s.StopStream(trimmedSerial); err != nil {
			return err
		}
	}

	args := []string{"-s", trimmedSerial, "logcat", "-v", "threadtime"}
	filterSpec := buildLogcatFilterSpec(levels, tagFilter)
	if filterSpec != "" {
		args = append(args, filterSpec)
	}

	cmd := exec.CommandContext(ctx, adbPath, args...)
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return NewOperationError(
			"start_logcat_stream",
			"Failed to open logcat stdout",
			err.Error(),
			true,
		)
	}

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return NewOperationError(
			"start_logcat_stream",
			"Failed to open logcat stderr",
			err.Error(),
			true,
		)
	}

	if err := cmd.Start(); err != nil {
		return NewOperationError(
			"start_logcat_stream",
			"Failed to start logcat stream",
			err.Error(),
			true,
		)
	}

	stream := &logcatStream{
		serial: trimmedSerial,
		cmd:    cmd,
		stdout: stdoutPipe,
		stderr: stderrPipe,
	}

	s.mu.Lock()
	s.streams[trimmedSerial] = stream
	s.mu.Unlock()

	go s.readLogcatOutput(stream, stdoutPipe, false)
	go s.readLogcatOutput(stream, stderrPipe, true)
	go s.waitForStreamExit(stream)

	wailsruntime.EventsEmit(s.ctx, LogcatEventStatus, LogcatStatusEvent{
		Serial: trimmedSerial,
		Status: "started",
	})

	return nil
}

func (s *LogcatService) StopStream(serial string) error {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return NewOperationError(
			"stop_logcat_stream",
			"Device serial is required",
			"serial must not be empty",
			false,
		)
	}

	s.mu.Lock()
	stream, ok := s.streams[trimmedSerial]
	s.mu.Unlock()
	if !ok {
		return NewOperationError(
			"stop_logcat_stream",
			"Logcat stream was not found",
			fmt.Sprintf("stream '%s' is not active", trimmedSerial),
			true,
		)
	}

	s.closeStream(stream, "stopped")
	return nil
}

func (s *LogcatService) Shutdown() {
	s.mu.Lock()
	streams := make([]*logcatStream, 0, len(s.streams))
	for _, stream := range s.streams {
		streams = append(streams, stream)
	}
	s.mu.Unlock()

	for _, stream := range streams {
		s.closeStream(stream, "stopped")
	}
}

func (s *LogcatService) readLogcatOutput(stream *logcatStream, pipe io.ReadCloser, isError bool) {
	defer pipe.Close()

	scanner := bufio.NewScanner(pipe)
	buffer := make([]byte, 0, 64*1024)
	scanner.Buffer(buffer, 1024*1024)

	for scanner.Scan() {
		entry := parseLogcatEntry(stream.serial, scanner.Text())
		if isError {
			entry.Level = "E"
		}
		wailsruntime.EventsEmit(s.ctx, LogcatEventLine, entry)
	}

	if err := scanner.Err(); err != nil {
		wailsruntime.EventsEmit(s.ctx, LogcatEventLine, LogcatEntry{
			ID:      uuid.NewString(),
			Serial:  stream.serial,
			Level:   "E",
			Message: err.Error(),
			Raw:     err.Error(),
		})
	}
}

func (s *LogcatService) waitForStreamExit(stream *logcatStream) {
	err := stream.cmd.Wait()
	if err != nil {
		s.closeStream(stream, "error")
		return
	}

	s.closeStream(stream, "stopped")
}

func (s *LogcatService) closeStream(stream *logcatStream, status string) {
	stream.once.Do(func() {
		s.mu.Lock()
		delete(s.streams, stream.serial)
		s.mu.Unlock()

		if stream.stdout != nil {
			_ = stream.stdout.Close()
		}
		if stream.stderr != nil {
			_ = stream.stderr.Close()
		}
		if stream.cmd != nil && stream.cmd.Process != nil {
			_ = stream.cmd.Process.Kill()
		}

		wailsruntime.EventsEmit(s.ctx, LogcatEventStatus, LogcatStatusEvent{
			Serial: stream.serial,
			Status: status,
		})
	})
}

func (s *LogcatService) resolveADBPath() (string, error) {
	if s.binaryService == nil {
		return "", NewOperationError(
			"resolve_logcat_binary",
			"Required binary service is not available",
			"binary service is nil",
			false,
		)
	}

	status := s.binaryService.GetBinaryStatus(nil)
	if status.Adb == nil || status.Adb.Status != BinaryReady || status.Adb.Path == "" {
		return "", NewOperationError(
			"resolve_logcat_binary",
			"Required binary is not ready",
			"binary 'adb' is unavailable",
			true,
		)
	}

	return status.Adb.Path, nil
}

func (s *LogcatService) hasStream(serial string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, ok := s.streams[serial]
	return ok
}

func buildLogcatFilterSpec(levels string, tagFilter string) string {
	normalizedLevels := strings.ToUpper(strings.TrimSpace(levels))
	normalizedTag := strings.TrimSpace(tagFilter)

	if normalizedTag == "" {
		if normalizedLevels == "" {
			return ""
		}
		return fmt.Sprintf("*:%s", normalizedLevels)
	}

	if normalizedLevels == "" {
		normalizedLevels = "V"
	}

	return fmt.Sprintf("%s:%s", normalizedTag, normalizedLevels)
}

func parseLogcatEntry(serial string, rawLine string) LogcatEntry {
	trimmedLine := strings.TrimRight(rawLine, "\r\n")
	entry := LogcatEntry{
		ID:      uuid.NewString(),
		Serial:  serial,
		Level:   "V",
		Message: trimmedLine,
		Raw:     trimmedLine,
	}

	matches := logcatPattern.FindStringSubmatch(trimmedLine)
	if len(matches) != 8 {
		return entry
	}

	entry.Date = matches[1]
	entry.Time = matches[2]
	entry.PID = matches[3]
	entry.TID = matches[4]
	entry.Level = matches[5]
	entry.Tag = strings.TrimSpace(matches[6])
	entry.Message = matches[7]
	entry.Timestamp = fmt.Sprintf("%s %s", entry.Date, entry.Time)

	return entry
}
