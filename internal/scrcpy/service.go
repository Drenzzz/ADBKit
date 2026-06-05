package scrcpy

import (
	"ADBKit/internal/audit"
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"ADBKit/internal/dialog"
	"context"
	"fmt"
	"os/exec"
	"sync"
	"time"

	"github.com/google/uuid"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	EventSessionStarted = "scrcpy_session_started"
	EventSessionStopped = "scrcpy_session_stopped"
	EventError          = "scrcpy_error"
)

type SessionStatus string

const (
	StatusStarting SessionStatus = "starting"
	StatusRunning  SessionStatus = "running"
	StatusStopping SessionStatus = "stopping"
	StatusStopped  SessionStatus = "stopped"
	StatusError    SessionStatus = "error"
)

type Options struct {
	MaxSize            int    `json:"max_size"`
	BitRate            int    `json:"bit_rate"`
	MaxFPS             int    `json:"max_fps"`
	AudioBitRate       int    `json:"audio_bit_rate"`
	AudioCodec         string `json:"audio_codec"`
	VideoCodec         string `json:"video_codec"`
	ShowTouches        bool   `json:"show_touches"`
	NoAudio            bool   `json:"no_audio"`
	NoControl          bool   `json:"no_control"`
	StayAwake          bool   `json:"stay_awake"`
	TurnScreenOff      bool   `json:"turn_screen_off"`
	PowerOffOnClose    bool   `json:"power_off_on_close"`
	Fullscreen         bool   `json:"fullscreen"`
	AlwaysOnTop        bool   `json:"always_on_top"`
	DisableScreensaver bool   `json:"disable_screensaver"`
	Rotation           int    `json:"rotation"`
	DisplayID          int    `json:"display_id"`
	TimeLimit          int    `json:"time_limit"`
}

func (o Options) ToArgs() []string {
	args := []string{}
	if o.MaxSize > 0 {
		args = append(args, "--max-size", fmt.Sprintf("%d", o.MaxSize))
	}
	if o.BitRate > 0 {
		args = append(args, "--video-bit-rate", fmt.Sprintf("%d", o.BitRate))
	}
	if o.MaxFPS > 0 {
		args = append(args, "--max-fps", fmt.Sprintf("%d", o.MaxFPS))
	}
	if o.AudioBitRate > 0 {
		args = append(args, "--audio-bit-rate", fmt.Sprintf("%d", o.AudioBitRate))
	}
	if o.AudioCodec != "" && o.AudioCodec != "opus" {
		args = append(args, "--audio-codec", o.AudioCodec)
	}
	if o.VideoCodec != "" && o.VideoCodec != "h264" {
		args = append(args, "--video-codec", o.VideoCodec)
	}
	if o.ShowTouches {
		args = append(args, "--show-touches")
	}
	if o.NoAudio {
		args = append(args, "--no-audio")
	}
	if o.NoControl {
		args = append(args, "--no-control")
	}
	if o.StayAwake {
		args = append(args, "--stay-awake")
	}
	if o.TurnScreenOff {
		args = append(args, "--turn-screen-off")
	}
	if o.PowerOffOnClose {
		args = append(args, "--power-off-on-close")
	}
	if o.Fullscreen {
		args = append(args, "--fullscreen")
	}
	if o.AlwaysOnTop {
		args = append(args, "--always-on-top")
	}
	if o.DisableScreensaver {
		args = append(args, "--disable-screensaver")
	}
	if o.Rotation > 0 {
		args = append(args, "--display-orientation", fmt.Sprintf("%d", o.Rotation))
	}
	if o.DisplayID > 0 {
		args = append(args, "--display-id", fmt.Sprintf("%d", o.DisplayID))
	}
	if o.TimeLimit > 0 {
		args = append(args, "--time-limit", fmt.Sprintf("%d", o.TimeLimit))
	}
	return args
}

type Session struct {
	ID        string        `json:"id"`
	Serial    string        `json:"serial"`
	Status    SessionStatus `json:"status"`
	PID       int           `json:"pid"`
	StartedAt int64         `json:"startedAt"`
}

type SessionEvent struct {
	SessionID string        `json:"sessionId"`
	Serial    string        `json:"serial"`
	Status    SessionStatus `json:"status"`
	PID       int           `json:"pid,omitempty"`
	Message   string        `json:"message,omitempty"`
}

type scrcpyProcess struct {
	session Session
	cmd     *exec.Cmd
	cancel  context.CancelFunc
	once    sync.Once
}

type Service struct {
	ctx                 context.Context
	binSvc              *binary.Service
	getConfig           func() *core.AppConfig
	resolveActiveSerial func(context.Context) (string, error)
	diaSvc              *dialog.Service
	auditLog            *audit.Log

	mu      sync.Mutex
	process *scrcpyProcess
}

func New(
	ctx context.Context,
	binSvc *binary.Service,
	getConfig func() *core.AppConfig,
	resolveActiveSerial func(context.Context) (string, error),
	diaSvc *dialog.Service,
	auditLog *audit.Log,
) *Service {
	return &Service{
		ctx:                 ctx,
		binSvc:              binSvc,
		getConfig:           getConfig,
		resolveActiveSerial: resolveActiveSerial,
		diaSvc:              diaSvc,
		auditLog:            auditLog,
	}
}

func (s *Service) StartSession(ctx context.Context, serial string, opts Options) (*Session, error) {
	resolvedSerial, err := s.resolveSerial(ctx, serial)
	if err != nil {
		return nil, err
	}

	scrcpyPath, err := s.resolveBinaryPath()
	if err != nil {
		return nil, err
	}

	s.mu.Lock()
	if s.process != nil {
		active := s.process.session
		s.mu.Unlock()
		return nil, core.NewOperationError(
			"start_scrcpy_session",
			"Scrcpy session is already running",
			fmt.Sprintf("session '%s' is already active", active.ID),
			true,
		)
	}

	session := Session{
		ID:        uuid.NewString(),
		Serial:    resolvedSerial,
		Status:    StatusStarting,
		StartedAt: time.Now().Unix(),
	}
	processCtx, cancel := context.WithCancel(context.Background())
	args := []string{"--serial", resolvedSerial}
	args = append(args, opts.ToArgs()...)

	cmd := exec.CommandContext(processCtx, scrcpyPath, args...)
	process := &scrcpyProcess{
		session: session,
		cmd:     cmd,
		cancel:  cancel,
	}
	s.process = process
	s.mu.Unlock()

	s.logAudit("start_scrcpy_session", resolvedSerial, true, "")

	if err := cmd.Start(); err != nil {
		cancel()
		s.mu.Lock()
		if s.process == process {
			s.process = nil
		}
		s.mu.Unlock()
		s.emitErrorEvent(session, err.Error())
		s.logAudit("start_scrcpy_session", resolvedSerial, false, err.Error())
		return nil, core.NewOperationError(
			"start_scrcpy_session",
			"Failed to start scrcpy session",
			err.Error(),
			true,
		)
	}

	process.session.PID = cmd.Process.Pid
	process.session.Status = StatusRunning

	s.mu.Lock()
	if s.process == process {
		s.process.session = process.session
	}
	active := process.session
	s.mu.Unlock()

	wailsruntime.EventsEmit(s.ctx, EventSessionStarted, SessionEvent{
		SessionID: active.ID,
		Serial:    active.Serial,
		Status:    active.Status,
		PID:       active.PID,
	})

	go s.waitForSessionExit(process)

	return &active, nil
}

func (s *Service) StopSession(sessionID string) error {
	process, err := s.getSession(sessionID)
	if err != nil {
		return err
	}
	s.closeSession(process, StatusStopped, true, "")
	s.logAudit("stop_scrcpy_session", process.session.Serial, true, "")
	return nil
}

func (s *Service) GetActiveSession() *Session {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.process == nil {
		return nil
	}
	snapshot := s.process.session
	return &snapshot
}

func (s *Service) Shutdown() {
	s.mu.Lock()
	process := s.process
	s.mu.Unlock()
	if process != nil {
		s.closeSession(process, StatusStopped, false, "")
	}
}

func (s *Service) waitForSessionExit(process *scrcpyProcess) {
	err := process.cmd.Wait()
	if err != nil {
		s.closeSession(process, StatusError, true, err.Error())
		return
	}
	s.closeSession(process, StatusStopped, true, "")
}

func (s *Service) closeSession(process *scrcpyProcess, status SessionStatus, emitEvent bool, message string) {
	process.once.Do(func() {
		s.mu.Lock()
		if s.process == process {
			updated := process.session
			updated.Status = status
			process.session = updated
			s.process = nil
		}
		s.mu.Unlock()

		if process.cancel != nil {
			process.cancel()
		}
		if process.cmd != nil && process.cmd.Process != nil {
			_ = process.cmd.Process.Kill()
		}

		if !emitEvent {
			return
		}

		event := SessionEvent{
			SessionID: process.session.ID,
			Serial:    process.session.Serial,
			Status:    status,
			PID:       process.session.PID,
			Message:   message,
		}

		if status == StatusError {
			wailsruntime.EventsEmit(s.ctx, EventError, event)
			return
		}
		wailsruntime.EventsEmit(s.ctx, EventSessionStopped, event)
	})
}

func (s *Service) getSession(sessionID string) (*scrcpyProcess, error) {
	trimmed := sessionID
	if trimmed == "" {
		return nil, core.NewOperationError(
			"scrcpy_session",
			"Scrcpy session ID is required",
			"session ID must not be empty",
			false,
		)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.process == nil || s.process.session.ID != trimmed {
		return nil, core.NewOperationError(
			"scrcpy_session",
			"Scrcpy session was not found",
			fmt.Sprintf("session '%s' is not active", trimmed),
			true,
		)
	}
	return s.process, nil
}

func (s *Service) resolveSerial(ctx context.Context, serial string) (string, error) {
	trimmed := serial
	if trimmed != "" {
		return trimmed, nil
	}
	if s.resolveActiveSerial == nil {
		return "", core.NewOperationError(
			"resolve_scrcpy_serial",
			"No active device resolver is available",
			"resolveActiveSerial callback is nil",
			false,
		)
	}
	return s.resolveActiveSerial(ctx)
}

func (s *Service) resolveBinaryPath() (string, error) {
	if s.binSvc == nil || s.getConfig == nil {
		return "", core.NewOperationError(
			"resolve_scrcpy_binary",
			"Required binary service is not available",
			"binary service is nil",
			false,
		)
	}
	status := s.binSvc.GetBinaryStatus(s.getConfig())
	if status == nil || status.Scrcpy == nil || status.Scrcpy.Status != binary.BinaryReady || status.Scrcpy.Path == "" {
		return "", core.NewOperationError(
			"resolve_scrcpy_binary",
			"Required binary is not ready",
			"binary 'scrcpy' is unavailable",
			true,
		)
	}
	return status.Scrcpy.Path, nil
}

func (s *Service) resolveADBPath() (string, error) {
	if s.binSvc == nil || s.getConfig == nil {
		return "", core.NewOperationError(
			"resolve_scrcpy_adb",
			"Required binary service is not available",
			"binary service is nil",
			false,
		)
	}
	status := s.binSvc.GetBinaryStatus(s.getConfig())
	if status == nil || status.Adb == nil || status.Adb.Status != binary.BinaryReady || status.Adb.Path == "" {
		return "", core.NewOperationError(
			"resolve_scrcpy_adb",
			"Required binary is not ready",
			"binary 'adb' is unavailable",
			true,
		)
	}
	return status.Adb.Path, nil
}

func (s *Service) emitErrorEvent(session Session, message string) {
	wailsruntime.EventsEmit(s.ctx, EventError, SessionEvent{
		SessionID: session.ID,
		Serial:    session.Serial,
		Status:    StatusError,
		PID:       session.PID,
		Message:   message,
	})
}

func (s *Service) logAudit(operation, serial string, success bool, errMsg string) {
	if s.auditLog == nil {
		return
	}
	_ = s.auditLog.Log(audit.Entry{
		Operation: operation,
		Command:   fmt.Sprintf("serial=%s", serial),
		Success:   success,
		Error:     errMsg,
	})
}
