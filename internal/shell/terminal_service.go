package shell

import (
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"context"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v3/pkg/application"
)

const (
	EventOutput = "terminal_output"
	EventClosed = "terminal_closed"
)

const (
	ModeShell    = "adb-shell"
	ModeADBHost  = "adb-host"
	ModeFastboot = "fastboot-host"
)

type Session struct {
	ID     string `json:"id"`
	Serial string `json:"serial"`
	Mode   string `json:"mode"`
}

type terminalProcess struct {
	session Session
	cmd     *exec.Cmd
	binary  string
	once    sync.Once
	running atomic.Bool
}

type TerminalService struct {
	ctx           context.Context
	binaryService *binary.Service
	getConfig     func() *core.AppConfig
	resolveSerial func(context.Context, string) (string, error)

	mu       sync.Mutex
	sessions map[string]*terminalProcess
}

func NewTerminalService(
	ctx context.Context,
	binaryService *binary.Service,
	getConfig func() *core.AppConfig,
	resolveSerial func(context.Context, string) (string, error),
) *TerminalService {
	return &TerminalService{
		ctx:           ctx,
		binaryService: binaryService,
		getConfig:     getConfig,
		resolveSerial: resolveSerial,
		sessions:      make(map[string]*terminalProcess),
	}
}

func (s *TerminalService) StartSession(ctx context.Context, serial string) (*Session, error) {
	return s.StartSessionWithMode(ctx, ModeShell, serial, "")
}

func (s *TerminalService) StartSessionWithMode(ctx context.Context, mode string, serial string, initialArgs string) (*Session, error) {
	log.Printf("terminal: StartSessionWithMode mode=%q serial=%q", mode, serial)
	resolvedSerial := strings.TrimSpace(serial)
	trimmedMode := strings.TrimSpace(mode)
	if trimmedMode == "" {
		trimmedMode = ModeShell
	}

	if trimmedMode != ModeShell && trimmedMode != ModeADBHost && trimmedMode != ModeFastboot {
		return nil, core.NewOperationError("start_terminal_session", "Terminal mode is invalid", fmt.Sprintf("unsupported mode '%s'", trimmedMode), false)
	}

	if resolvedSerial == "" {
		var err error
		if s.resolveSerial == nil {
			return nil, core.NewOperationError("start_terminal_session", "Terminal serial resolver is unavailable", "resolver callback is nil", false)
		}
		resolvedSerial, err = s.resolveSerial(ctx, trimmedMode)
		if err != nil {
			log.Printf("terminal: resolveSerial failed: %v", err)
			return nil, err
		}
	}

	binaryPath, err := s.resolveBinaryPath(terminalBinaryName(trimmedMode))
	if err != nil {
		log.Printf("terminal: resolveBinaryPath %s failed: %v", terminalBinaryName(trimmedMode), err)
		return nil, err
	}

	session := Session{
		ID:     uuid.NewString(),
		Serial: resolvedSerial,
		Mode:   trimmedMode,
	}

	process := &terminalProcess{
		session: session,
		binary:  binaryPath,
	}

	s.mu.Lock()
	s.sessions[session.ID] = process
	s.mu.Unlock()

	log.Printf("terminal: session created id=%q mode=%q serial=%q", session.ID, session.Mode, resolvedSerial)

	prompt := s.buildPrompt(resolvedSerial, trimmedMode)
	s.emitSessionOutput(session, prompt+"Ready for commands\r\n\r\n")

	return &session, nil
}

func (s *TerminalService) SendInput(sessionID string, input string) error {
	process, err := s.getSession(sessionID)
	if err != nil {
		return err
	}

	trimmedInput := strings.TrimSpace(input)
	if trimmedInput == "" {
		return nil
	}

	if !process.running.CompareAndSwap(false, true) {
		return core.NewOperationError("send_terminal_input", "A command is already running", "wait for the current command to finish", true)
	}
	go s.runCommand(process, trimmedInput)
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

func (s *TerminalService) runCommand(process *terminalProcess, input string) {
	defer process.running.Store(false)
	args := splitTerminalArgs(input)
	if len(args) == 0 {
		return
	}

	commandArgs := buildTerminalCommandArgs(process.session.Mode, process.session.Serial, args)

	s.emitSessionOutput(process.session, fmt.Sprintf("$ %s\r\n", input))

	result, err := core.RunCommand(context.Background(), core.ExecRequest{
		Command: process.binary,
		Args:    commandArgs,
		Timeout: 2 * time.Minute,
	})
	if err != nil {
		s.emitSessionOutput(process.session, fmt.Sprintf("%s\r\n\r\n", err.Error()))
		return
	}

	output := strings.TrimSpace(strings.Join([]string{result.Stdout, result.Stderr}, "\n"))
	if output == "" {
		output = "Command completed"
	}

	s.emitSessionOutput(process.session, output+"\r\n\r\n")
}

func (s *TerminalService) buildPrompt(serial string, mode string) string {
	switch mode {
	case ModeShell:
		codename := s.resolveCodename(serial)
		return fmt.Sprintf("%s:/ $ ", codename)
	case ModeADBHost:
		return "$ "
	case ModeFastboot:
		return "fastboot> "
	default:
		return "$ "
	}
}

func (s *TerminalService) resolveCodename(serial string) string {
	if serial == "" {
		return "device"
	}

	adbStatus := s.binaryService.GetBinaryStatus(s.getConfig())
	if adbStatus == nil || adbStatus.Adb == nil {
		return serial
	}

	result, err := core.RunCommand(context.Background(), core.ExecRequest{
		Command: adbStatus.Adb.Path,
		Args:    []string{"-s", serial, "shell", "getprop", "ro.product.device"},
	})
	if err != nil {
		return serial
	}

	codename := strings.TrimSpace(result.Stdout)
	if codename == "" {
		return serial
	}
	return codename
}

func (s *TerminalService) emitSessionOutput(session Session, data string) {
	application.Get().Event.Emit(EventOutput, map[string]string{
		"sessionId": session.ID,
		"serial":    session.Serial,
		"data":      data,
	})
}

func (s *TerminalService) closeSession(process *terminalProcess, emitEvent bool) {
	process.once.Do(func() {
		s.mu.Lock()
		delete(s.sessions, process.session.ID)
		s.mu.Unlock()

		if process.cmd != nil && process.cmd.Process != nil {
			_ = process.cmd.Process.Kill()
		}

		if emitEvent {
			application.Get().Event.Emit(EventClosed, map[string]string{
				"sessionId": process.session.ID,
				"serial":    process.session.Serial,
			})
		}
	})
}

func (s *TerminalService) getSession(sessionID string) (*terminalProcess, error) {
	trimmedSessionID := strings.TrimSpace(sessionID)
	if trimmedSessionID == "" {
		return nil, core.NewOperationError("terminal_session", "Terminal session ID is required", "session ID must not be empty", false)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	process, ok := s.sessions[trimmedSessionID]
	if !ok {
		return nil, core.NewOperationError("terminal_session", "Terminal session was not found", fmt.Sprintf("session '%s' is not active", trimmedSessionID), true)
	}

	return process, nil
}

func (s *TerminalService) resolveBinaryPath(name string) (string, error) {
	if s.binaryService == nil {
		return "", core.NewOperationError("resolve_terminal_binary", "Required binary service is not available", "binary service is nil", false)
	}

	if s.getConfig == nil {
		return "", core.NewOperationError("resolve_terminal_binary", "Application config is unavailable", "config getter is nil", false)
	}
	status := s.binaryService.GetBinaryStatus(s.getConfig())
	var info *core.BinaryInfo
	switch name {
	case core.BinaryNameAdb:
		info = status.Adb
	case core.BinaryNameFastboot:
		info = status.Fastboot
	case core.BinaryNameScrcpy:
		info = status.Scrcpy
	}

	if info == nil || info.Status != core.BinaryReady || info.Path == "" {
		return "", core.NewOperationError("resolve_terminal_binary", "Required binary is not ready", fmt.Sprintf("binary '%s' is unavailable", name), true)
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

func terminalBinaryName(mode string) string {
	if mode == ModeFastboot {
		return core.BinaryNameFastboot
	}
	return core.BinaryNameAdb
}

func buildTerminalCommandArgs(mode, serial string, args []string) []string {
	switch mode {
	case ModeShell:
		return append([]string{"-s", serial, "shell"}, args...)
	case ModeADBHost, ModeFastboot:
		return append([]string{"-s", serial}, args...)
	default:
		return nil
	}
}
