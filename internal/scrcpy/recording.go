package scrcpy

import (
	"ADBKit/internal/core"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

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

	adbPath, _ := s.resolveADBPath()

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
	core.ConfigureChildProcess(cmd)
	if adbPath != "" {
		cmd.Env = append(os.Environ(), "ADB="+adbPath)
	}
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
	core.ConfigureChildProcess(cmd)
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
