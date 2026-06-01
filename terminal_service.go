package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"os/exec"
	"strings"
	"sync"

	"github.com/google/uuid"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	TerminalEventOutput = "terminal_output"
	TerminalEventClosed = "terminal_closed"
)

const (
	TerminalModeShell    = "adb-shell"
	TerminalModeADBHost  = "adb-host"
	TerminalModeFastboot = "fastboot-host"
)

type TerminalSession struct {
	ID     string `json:"id"`
	Serial string `json:"serial"`
	Mode   string `json:"mode"`
}

type terminalProcess struct {
	session   TerminalSession
	cmd       *exec.Cmd
	stdinPipe io.WriteCloser
	binary    string
	once      sync.Once
}

type TerminalService struct {
	ctx                 context.Context
	binaryService       *BinaryService
	getConfig           func() *AppConfig
	resolveActiveSerial func(context.Context) (string, error)

	mu       sync.Mutex
	sessions map[string]*terminalProcess
}

func NewTerminalService(
	ctx context.Context,
	binaryService *BinaryService,
	getConfig func() *AppConfig,
	resolveActiveSerial func(context.Context) (string, error),
) *TerminalService {
	return &TerminalService{
		ctx:                 ctx,
		binaryService:       binaryService,
		getConfig:           getConfig,
		resolveActiveSerial: resolveActiveSerial,
		sessions:            make(map[string]*terminalProcess),
	}
}

func (s *TerminalService) StartSession(ctx context.Context, serial string) (*TerminalSession, error) {
	return s.StartSessionWithMode(ctx, TerminalModeShell, serial, "")
}

func (s *TerminalService) StartSessionWithMode(ctx context.Context, mode string, serial string, initialArgs string) (*TerminalSession, error) {
	log.Printf("terminal: StartSessionWithMode mode=%q serial=%q", mode, serial)
	resolvedSerial := strings.TrimSpace(serial)
	trimmedMode := strings.TrimSpace(mode)
	if trimmedMode == "" {
		trimmedMode = TerminalModeShell
	}

	if trimmedMode != TerminalModeShell && trimmedMode != TerminalModeADBHost && trimmedMode != TerminalModeFastboot {
		return nil, NewOperationError(
			"start_terminal_session",
			"Terminal mode is invalid",
			fmt.Sprintf("unsupported mode '%s'", trimmedMode),
			false,
		)
	}

	trimmedInitialArgs := strings.TrimSpace(initialArgs)
	if trimmedMode == TerminalModeShell && trimmedInitialArgs != "" {
		return nil, NewOperationError(
			"start_terminal_session",
			"Initial terminal arguments are not supported for shell sessions",
			"initialArgs must be empty for adb shell mode",
			false,
		)
	}

	if resolvedSerial == "" {
		var err error
		resolvedSerial, err = s.resolveActiveSerial(ctx)
		if err != nil {
			log.Printf("terminal: resolveActiveSerial failed: %v", err)
			return nil, err
		}
	}

	adbPath, err := s.resolveBinaryPath(BinaryNameAdb)
	if err != nil {
		log.Printf("terminal: resolveBinaryPath adb failed: %v", err)
		return nil, err
	}

	session := TerminalSession{
		ID:     uuid.NewString(),
		Serial: resolvedSerial,
		Mode:   trimmedMode,
	}

	commandArgs := []string{"-s", resolvedSerial, "shell"}
	isInteractiveShell := trimmedMode == TerminalModeShell
	if trimmedMode == TerminalModeADBHost {
		commandArgs = nil
	} else if trimmedMode == TerminalModeFastboot {
		adbPath, err = s.resolveBinaryPath(BinaryNameFastboot)
		if err != nil {
			log.Printf("terminal: resolveBinaryPath fastboot failed: %v", err)
			return nil, err
		}
		commandArgs = nil
	}

	cmd := exec.CommandContext(ctx, adbPath, commandArgs...)

	process := &terminalProcess{
		session: session,
		binary:  adbPath,
		cmd:     cmd,
	}

	if isInteractiveShell {
		log.Printf("terminal: creating interactive shell command=%q args=%v", adbPath, commandArgs)
		stdinPipe, stdinErr := cmd.StdinPipe()
		if stdinErr != nil {
			log.Printf("terminal: stdin pipe failed: %v", stdinErr)
			return nil, NewOperationError(
				"start_terminal_session",
				"Failed to create stdin pipe",
				stdinErr.Error(),
				true,
			)
		}
		process.stdinPipe = stdinPipe

		stdoutPipe, stdoutErr := cmd.StdoutPipe()
		if stdoutErr != nil {
			log.Printf("terminal: stdout pipe failed: %v", stdoutErr)
			return nil, NewOperationError(
				"start_terminal_session",
				"Failed to create stdout pipe",
				stdoutErr.Error(),
				true,
			)
		}

		stderrPipe, stderrErr := cmd.StderrPipe()
		if stderrErr != nil {
			log.Printf("terminal: stderr pipe failed: %v", stderrErr)
			return nil, NewOperationError(
				"start_terminal_session",
				"Failed to create stderr pipe",
				stderrErr.Error(),
				true,
			)
		}

		if startErr := cmd.Start(); startErr != nil {
			log.Printf("terminal: cmd.Start failed: %v", startErr)
			return nil, NewOperationError(
				"start_terminal_session",
				"Failed to start terminal session",
				startErr.Error(),
				true,
			)
		}

		go s.streamReader(session, stdoutPipe)
		go s.streamReader(session, stderrPipe)
		go s.waitForSessionExit(process)
	}

	log.Printf("terminal: session created id=%q mode=%q interactive=%t", session.ID, session.Mode, isInteractiveShell)

	s.mu.Lock()
	s.sessions[session.ID] = process
	s.mu.Unlock()

	if !isInteractiveShell {
		s.emitSessionOutput(session, fmt.Sprintf("[%s] Ready for commands\r\n", session.Mode))
	}

	return &session, nil
}

func (s *TerminalService) SendInput(sessionID string, input string) error {
	process, err := s.getSession(sessionID)
	if err != nil {
		return err
	}

	if process.session.Mode == TerminalModeShell {
		if process.stdinPipe == nil {
			return NewOperationError("send_terminal_input", "Terminal stdin is not available", "", false)
		}
		if _, err := io.WriteString(process.stdinPipe, input); err != nil {
			s.closeSession(process, true)
			return NewOperationError(
				"send_terminal_input",
				"Failed to write terminal input",
				err.Error(),
				true,
			)
		}
		return nil
	}

	trimmedInput := strings.TrimSpace(input)
	if trimmedInput == "" {
		return nil
	}

	go s.runHostCommand(process, trimmedInput)
	return nil
}

func (s *TerminalService) CloseSession(sessionID string) error {
	process, err := s.getSession(sessionID)
	if err != nil {
		return err
	}

	s.closeSession(process, true)
	return nil
}

func (s *TerminalService) Shutdown() {
	s.mu.Lock()
	processes := make([]*terminalProcess, 0, len(s.sessions))
	for _, process := range s.sessions {
		processes = append(processes, process)
	}
	s.mu.Unlock()

	for _, process := range processes {
		s.closeSession(process, false)
	}
}

func (s *TerminalService) streamReader(session TerminalSession, reader io.ReadCloser) {
	defer reader.Close()

	scanner := bufio.NewScanner(reader)
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)

	for scanner.Scan() {
		wailsruntime.EventsEmit(s.ctx, TerminalEventOutput, map[string]string{
			"sessionId": session.ID,
			"serial":    session.Serial,
			"data":      scanner.Text() + "\r\n",
		})
	}

	if err := scanner.Err(); err != nil && err != io.EOF {
		wailsruntime.EventsEmit(s.ctx, TerminalEventOutput, map[string]string{
			"sessionId": session.ID,
			"serial":    session.Serial,
			"data":      fmt.Sprintf("\r\n[terminal-error] %s\r\n", err.Error()),
		})
	}
}

func (s *TerminalService) waitForSessionExit(process *terminalProcess) {
	err := process.cmd.Wait()
	if err != nil {
		wailsruntime.EventsEmit(s.ctx, TerminalEventOutput, map[string]string{
			"sessionId": process.session.ID,
			"serial":    process.session.Serial,
			"data":      fmt.Sprintf("\r\n[terminal-exit] %s\r\n", err.Error()),
		})
	}

	s.closeSession(process, true)
}

func (s *TerminalService) closeSession(process *terminalProcess, emitEvent bool) {
	process.once.Do(func() {
		s.mu.Lock()
		delete(s.sessions, process.session.ID)
		s.mu.Unlock()

		if process.stdinPipe != nil {
			_ = process.stdinPipe.Close()
		}
		if process.cmd != nil && process.cmd.Process != nil {
			_ = process.cmd.Process.Kill()
		}

		if emitEvent {
			wailsruntime.EventsEmit(s.ctx, TerminalEventClosed, map[string]string{
				"sessionId": process.session.ID,
				"serial":    process.session.Serial,
			})
		}
	})
}

func (s *TerminalService) runHostCommand(process *terminalProcess, input string) {
	args := splitTerminalArgs(input)
	if len(args) == 0 {
		return
	}

	commandArgs := append([]string{"-s", process.session.Serial}, args...)
	s.emitSessionOutput(process.session, fmt.Sprintf("$ %s\r\n", input))

	result, err := RunCommand(context.Background(), ExecRequest{
		Command: process.binary,
		Args:    commandArgs,
	})
	if err != nil {
		s.emitSessionOutput(process.session, fmt.Sprintf("%s\r\n", err.Error()))
		return
	}

	combined := strings.TrimSpace(strings.Join([]string{result.Stdout, result.Stderr}, "\n"))
	if combined == "" {
		combined = "Command completed"
	}
	if !strings.HasSuffix(combined, "\n") {
		combined += "\r\n"
	}

	s.emitSessionOutput(process.session, combined)
}

func (s *TerminalService) emitSessionOutput(session TerminalSession, data string) {
	wailsruntime.EventsEmit(s.ctx, TerminalEventOutput, map[string]string{
		"sessionId": session.ID,
		"serial":    session.Serial,
		"data":      data,
	})
}

func (s *TerminalService) getSession(sessionID string) (*terminalProcess, error) {
	trimmedSessionID := strings.TrimSpace(sessionID)
	if trimmedSessionID == "" {
		return nil, NewOperationError(
			"terminal_session",
			"Terminal session ID is required",
			"session ID must not be empty",
			false,
		)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	process, ok := s.sessions[trimmedSessionID]
	if !ok {
		return nil, NewOperationError(
			"terminal_session",
			"Terminal session was not found",
			fmt.Sprintf("session '%s' is not active", trimmedSessionID),
			true,
		)
	}

	return process, nil
}

func (s *TerminalService) resolveBinaryPath(name string) (string, error) {
	if s.binaryService == nil {
		return "", NewOperationError(
			"resolve_terminal_binary",
			"Required binary service is not available",
			"binary service is nil",
			false,
		)
	}

	if s.getConfig == nil {
		return "", NewOperationError(
			"resolve_terminal_binary",
			"Application config is unavailable",
			"config getter is nil",
			false,
		)
	}
	status := s.binaryService.GetBinaryStatus(s.getConfig())
	var info *BinaryInfo
	switch name {
	case BinaryNameAdb:
		info = status.Adb
	case BinaryNameFastboot:
		info = status.Fastboot
	case BinaryNameScrcpy:
		info = status.Scrcpy
	}

	if info == nil || info.Status != BinaryReady || info.Path == "" {
		return "", NewOperationError(
			"resolve_terminal_binary",
			"Required binary is not ready",
			fmt.Sprintf("binary '%s' is unavailable", name),
			true,
		)
	}

	return info.Path, nil
}

func splitTerminalArgs(input string) []string {
	trimmedInput := strings.TrimSpace(input)
	if trimmedInput == "" {
		return nil
	}

	return strings.Fields(trimmedInput)
}
