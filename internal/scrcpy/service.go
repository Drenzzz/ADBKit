package scrcpy

import (
	"ADBKit/internal/audit"
	"ADBKit/internal/binary"
	"ADBKit/internal/core"
	"ADBKit/internal/dialog"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sort"
	"strings"
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

type CodecSupport struct {
	Codec        string `json:"codec"`
	EncoderName  string `json:"encoderName"`
	Hardware     bool   `json:"hardware"`
	Vendor       bool   `json:"vendor"`
	SoftwareOnly bool   `json:"softwareOnly"`
	Recommended  bool   `json:"recommended"`
	AliasOf      string `json:"aliasOf"`
}

type EncoderSupport struct {
	Serial      string         `json:"serial"`
	VideoCodecs []CodecSupport `json:"videoCodecs"`
	AudioCodecs []CodecSupport `json:"audioCodecs"`
}

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

	recordingMu   sync.Mutex
	recordingCmd  *exec.Cmd
	recordingPath string
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

func (s *Service) StartRecording(serial, outputPath string, opts Options) error {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return core.NewOperationError(
			"start_scrcpy_recording",
			"Device serial is required",
			"serial must not be empty",
			false,
		)
	}
	trimmedPath := strings.TrimSpace(outputPath)
	if trimmedPath == "" {
		return core.NewOperationError(
			"start_scrcpy_recording",
			"Output file path is required",
			"output path must not be empty",
			false,
		)
	}

	s.recordingMu.Lock()
	if s.recordingCmd != nil {
		s.recordingMu.Unlock()
		return core.NewOperationError(
			"start_scrcpy_recording",
			"Recording is already in progress",
			"stop current recording before starting a new one",
			true,
		)
	}
	s.recordingMu.Unlock()

	scrcpyPath, err := s.resolveBinaryPath()
	if err != nil {
		return err
	}

	args := []string{"--no-playback", "--record=" + trimmedPath, "--serial=" + trimmedSerial}
	if opts.BitRate > 0 {
		args = append(args, "--video-bit-rate", fmt.Sprintf("%d", opts.BitRate))
	}
	if opts.MaxFPS > 0 {
		args = append(args, "--max-fps", fmt.Sprintf("%d", opts.MaxFPS))
	}
	if opts.MaxSize > 0 {
		args = append(args, "--max-size", fmt.Sprintf("%d", opts.MaxSize))
	}
	if opts.VideoCodec != "" && opts.VideoCodec != "h264" {
		args = append(args, "--video-codec", opts.VideoCodec)
	}
	if opts.NoAudio {
		args = append(args, "--no-audio")
	}

	cmd := exec.CommandContext(s.ctx, scrcpyPath, args...)
	stderrPipe, pipeErr := cmd.StderrPipe()
	if pipeErr != nil {
		return core.NewOperationError(
			"start_scrcpy_recording",
			"Failed to prepare recording process",
			pipeErr.Error(),
			true,
		)
	}

	if startErr := cmd.Start(); startErr != nil {
		return core.NewOperationError(
			"start_scrcpy_recording",
			"Failed to start scrcpy recording",
			startErr.Error(),
			true,
		)
	}

	s.recordingMu.Lock()
	s.recordingCmd = cmd
	s.recordingPath = trimmedPath
	s.recordingMu.Unlock()

	s.logAudit("start_scrcpy_recording", trimmedSerial, true, fmt.Sprintf("path=%s", trimmedPath))
	go s.monitorRecordingProcess(cmd, stderrPipe)
	return nil
}

func (s *Service) monitorRecordingProcess(cmd *exec.Cmd, stderrPipe io.ReadCloser) {
	var stderrBuf strings.Builder
	buf := make([]byte, 1024)
	for {
		n, readErr := stderrPipe.Read(buf)
		if n > 0 {
			stderrBuf.Write(buf[:n])
		}
		if readErr != nil {
			break
		}
	}

	exitErr := cmd.Wait()

	s.recordingMu.Lock()
	wasActive := s.recordingCmd == cmd
	if wasActive {
		s.recordingCmd = nil
		s.recordingPath = ""
	}
	s.recordingMu.Unlock()

	if wasActive && exitErr != nil {
		detail := strings.TrimSpace(stderrBuf.String())
		if detail == "" {
			detail = exitErr.Error()
		}
		wailsruntime.EventsEmit(s.ctx, EventError, SessionEvent{
			Status:  StatusError,
			Message: "Recording stopped unexpectedly: " + detail,
		})
	}
}

func (s *Service) StopRecording() (string, error) {
	s.recordingMu.Lock()
	cmd := s.recordingCmd
	outputPath := s.recordingPath
	s.recordingCmd = nil
	s.recordingPath = ""
	s.recordingMu.Unlock()

	if cmd == nil {
		return "", core.NewOperationError(
			"stop_scrcpy_recording",
			"No active recording found",
			"start a recording before stopping",
			true,
		)
	}

	if cmd.Process != nil {
		_ = cmd.Process.Signal(os.Interrupt)
		done := make(chan struct{})
		go func() {
			_ = cmd.Wait()
			close(done)
		}()
		select {
		case <-done:
		case <-time.After(5 * time.Second):
			_ = cmd.Process.Kill()
		}
	}

	info, statErr := os.Stat(outputPath)
	if statErr != nil || info.Size() == 0 {
		return "", core.NewOperationError(
			"stop_scrcpy_recording",
			"Recording file was not created",
			"scrcpy may have failed to capture video",
			true,
		)
	}

	s.logAudit("stop_scrcpy_recording", "", true, fmt.Sprintf("path=%s size=%d", outputPath, info.Size()))
	return outputPath, nil
}

func (s *Service) TakeScreenshot(sessionID, outputPath string) (string, error) {
	process, err := s.getSession(sessionID)
	if err != nil {
		return "", err
	}

	trimmedPath := strings.TrimSpace(outputPath)
	if trimmedPath == "" {
		return "", core.NewOperationError(
			"take_scrcpy_screenshot",
			"Output file path is required",
			"output path must not be empty",
			false,
		)
	}

	adbPath, err := s.resolveADBPath()
	if err != nil {
		return "", err
	}

	cmd := exec.CommandContext(s.ctx, adbPath, "-s", process.session.Serial, "exec-out", "screencap", "-p")
	outFile, createErr := os.Create(trimmedPath)
	if createErr != nil {
		return "", core.NewOperationError(
			"take_scrcpy_screenshot",
			"Failed to create screenshot file",
			createErr.Error(),
			true,
		)
	}
	defer outFile.Close()

	cmd.Stdout = outFile
	if runErr := cmd.Run(); runErr != nil {
		return "", core.NewOperationError(
			"take_scrcpy_screenshot",
			"Failed to capture screenshot",
			runErr.Error(),
			true,
		)
	}

	s.logAudit("take_scrcpy_screenshot", process.session.Serial, true, fmt.Sprintf("path=%s", trimmedPath))
	return trimmedPath, nil
}

func (s *Service) GetEncoderSupport(ctx context.Context, serial string) (*EncoderSupport, error) {
	resolvedSerial, err := s.resolveSerial(ctx, serial)
	if err != nil {
		return nil, err
	}

	scrcpyPath, err := s.resolveBinaryPath()
	if err != nil {
		return nil, err
	}

	cmd := exec.CommandContext(ctx, scrcpyPath, "--serial", resolvedSerial, "--list-encoders")
	out, runErr := cmd.CombinedOutput()
	if runErr != nil {
		return nil, core.NewOperationError(
			"get_scrcpy_encoder_support",
			"Failed to inspect scrcpy encoder support",
			strings.TrimSpace(string(out)),
			true,
		)
	}

	videoCodecs, audioCodecs := parseEncoderList(string(out))
	return &EncoderSupport{
		Serial:      resolvedSerial,
		VideoCodecs: videoCodecs,
		AudioCodecs: audioCodecs,
	}, nil
}

func parseEncoderList(output string) ([]CodecSupport, []CodecSupport) {
	videoMap := map[string]CodecSupport{}
	audioMap := map[string]CodecSupport{}
	section := ""

	for _, raw := range strings.Split(output, "\n") {
		line := strings.TrimSpace(raw)
		switch line {
		case "[server] INFO: List of video encoders:":
			section = "video"
			continue
		case "[server] INFO: List of audio encoders:":
			section = "audio"
			continue
		}
		if !strings.HasPrefix(line, "--") {
			continue
		}
		codec, encoderName, support, ok := parseEncoderLine(line)
		if !ok {
			continue
		}
		switch section {
		case "video":
			current, exists := videoMap[codec]
			if !exists || shouldReplaceCodec(current, support) {
				videoMap[codec] = support
			}
		case "audio":
			current, exists := audioMap[codec]
			if !exists || shouldReplaceCodec(current, support) {
				audioMap[codec] = support
			}
		}
		_ = encoderName
	}

	return sortCodecs(videoMap), sortCodecs(audioMap)
}

func parseEncoderLine(line string) (string, string, CodecSupport, bool) {
	parts := strings.Fields(line)
	var codec, encoderName string
	for _, part := range parts {
		switch {
		case strings.HasPrefix(part, "--video-codec="):
			codec = strings.TrimPrefix(part, "--video-codec=")
		case strings.HasPrefix(part, "--audio-codec="):
			codec = strings.TrimPrefix(part, "--audio-codec=")
		case strings.HasPrefix(part, "--video-encoder="):
			encoderName = strings.TrimPrefix(part, "--video-encoder=")
		case strings.HasPrefix(part, "--audio-encoder="):
			encoderName = strings.TrimPrefix(part, "--audio-encoder=")
		}
	}
	if codec == "" || encoderName == "" {
		return "", "", CodecSupport{}, false
	}
	hardware := strings.Contains(line, "(hw)")
	vendor := strings.Contains(line, "[vendor]")
	softwareOnly := strings.Contains(line, "(sw)") && !hardware
	aliasOf := extractAliasTarget(line)
	return codec, encoderName, CodecSupport{
		Codec:        codec,
		EncoderName:  encoderName,
		Hardware:     hardware,
		Vendor:       vendor,
		SoftwareOnly: softwareOnly,
		AliasOf:      aliasOf,
	}, true
}

// extractAliasTarget pulls the canonical encoder name out of a line that
// scrcpy annotated with "(alias for X)". The annotation is appended by
// scrcpy itself so the OMX entries never have to be hard-coded here.
func extractAliasTarget(line string) string {
	const marker = "(alias for "
	idx := strings.Index(line, marker)
	if idx < 0 {
		return ""
	}
	rest := line[idx+len(marker):]
	end := strings.Index(rest, ")")
	if end < 0 {
		return ""
	}
	return strings.TrimSpace(rest[:end])
}

func codecScore(s CodecSupport) int {
	score := 0
	if s.Hardware {
		score += 4
	}
	if s.Vendor {
		score += 2
	}
	if !s.SoftwareOnly {
		score += 1
	}
	// OMX aliases are wrappers over the canonical C2 encoder; demote them
	// so the encoder they route to always wins the recommendation slot.
	if s.AliasOf != "" {
		score -= 1
	}
	return score
}

func shouldReplaceCodec(current, candidate CodecSupport) bool {
	if codecScore(candidate) != codecScore(current) {
		return codecScore(candidate) > codecScore(current)
	}
	return candidate.EncoderName < current.EncoderName
}

func sortCodecs(entries map[string]CodecSupport) []CodecSupport {
	out := make([]CodecSupport, 0, len(entries))
	for _, entry := range entries {
		out = append(out, entry)
	}
	sort.Slice(out, func(i, j int) bool {
		if codecScore(out[i]) != codecScore(out[j]) {
			return codecScore(out[i]) > codecScore(out[j])
		}
		return out[i].Codec < out[j].Codec
	})
	// First entry after sort has the highest score — mark as recommended.
	if len(out) > 0 {
		out[0].Recommended = true
	}
	return out
}

func (s *Service) PushClipboard(serial, text string) error {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return core.NewOperationError(
			"push_scrcpy_clipboard",
			"Device serial is required",
			"serial must not be empty",
			false,
		)
	}
	if text == "" {
		return core.NewOperationError(
			"push_scrcpy_clipboard",
			"Clipboard text is required",
			"text must not be empty",
			false,
		)
	}

	adbPath, err := s.resolveADBPath()
	if err != nil {
		return err
	}

	cmd := exec.CommandContext(s.ctx, adbPath, "-s", trimmedSerial, "shell", "cmd", "clipboard", "set", text)
	if out, runErr := cmd.CombinedOutput(); runErr != nil {
		return core.NewOperationError(
			"push_scrcpy_clipboard",
			"Failed to push clipboard to device",
			strings.TrimSpace(string(out)),
			true,
		)
	}

	s.logAudit("push_scrcpy_clipboard", trimmedSerial, true, "")
	return nil
}

func (s *Service) GetClipboard(serial string) (string, error) {
	trimmedSerial := strings.TrimSpace(serial)
	if trimmedSerial == "" {
		return "", core.NewOperationError(
			"get_scrcpy_clipboard",
			"Device serial is required",
			"serial must not be empty",
			false,
		)
	}

	adbPath, err := s.resolveADBPath()
	if err != nil {
		return "", err
	}

	cmd := exec.CommandContext(s.ctx, adbPath, "-s", trimmedSerial, "shell", "cmd", "clipboard", "get")
	out, runErr := cmd.CombinedOutput()
	if runErr != nil {
		return "", core.NewOperationError(
			"get_scrcpy_clipboard",
			"Failed to read clipboard from device",
			strings.TrimSpace(string(out)),
			true,
		)
	}
	s.logAudit("get_scrcpy_clipboard", trimmedSerial, true, "")
	return strings.TrimRight(string(out), "\r\n"), nil
}
