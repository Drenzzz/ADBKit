package main

import (
	"ADBKit/internal/download"
	"ADBKit/internal/file"
	"ADBKit/internal/flasher"
	"ADBKit/internal/scrcpy"
	"ADBKit/internal/shell"

	"github.com/wailsapp/wails/v3/pkg/application"
)

const (
	fileDropEvent       = "files-dropped"
	binaryProgressEvent = "binary_download_progress"
)

func init() {
	application.RegisterEvent[map[string]string](shell.EventOutput)
	application.RegisterEvent[map[string]string](shell.EventClosed)
	application.RegisterEvent[shell.LogcatEntry](shell.EventLine)
	application.RegisterEvent[shell.LogcatStatusEvent](shell.EventStatus)
	application.RegisterEvent[scrcpy.SessionEvent](scrcpy.EventSessionStarted)
	application.RegisterEvent[scrcpy.SessionEvent](scrcpy.EventSessionStopped)
	application.RegisterEvent[scrcpy.SessionEvent](scrcpy.EventError)
	application.RegisterEvent[download.ProgressEvent](binaryProgressEvent)
	application.RegisterEvent[file.TransferProgress](file.TransferProgressEvent)
	application.RegisterEvent[flasher.StepStatus](flasher.FlashStepStatusEvent)
	application.RegisterEvent[[]string](fileDropEvent)
}
