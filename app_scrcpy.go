package main

import "ADBKit/internal/scrcpy"

func (a *App) StartScrcpySession(serial string, opts scrcpy.Options) (*scrcpy.Session, error) {
	return auditAction(a, "start_scrcpy_session", func() (*scrcpy.Session, error) {
		return a.scrSvc.StartSession(a.ctx, serial, opts)
	})
}

func (a *App) StopScrcpySession(sessionID string) error {
	return auditVoidAction(a, "stop_scrcpy_session", func() error {
		return a.scrSvc.StopSession(sessionID)
	})
}

func (a *App) GetActiveScrcpySession() *scrcpy.Session {
	return a.scrSvc.GetActiveSession()
}

func (a *App) StartScrcpyRecording(serial string, outputPath string, opts scrcpy.Options) error {
	return auditVoidAction(a, "start_scrcpy_recording", func() error {
		return a.scrSvc.StartRecording(serial, outputPath, opts)
	})
}

func (a *App) StopScrcpyRecording() (string, error) {
	return auditAction(a, "stop_scrcpy_recording", func() (string, error) {
		return a.scrSvc.StopRecording()
	})
}

func (a *App) TakeScrcpyScreenshot(sessionID string, outputPath string) (string, error) {
	return auditAction(a, "take_scrcpy_screenshot", func() (string, error) {
		return a.scrSvc.TakeScreenshot(sessionID, outputPath)
	})
}

func (a *App) GetScrcpyEncoderSupport(serial string) (*scrcpy.EncoderSupport, error) {
	return auditAction(a, "get_scrcpy_encoder_support", func() (*scrcpy.EncoderSupport, error) {
		return a.scrSvc.GetEncoderSupport(a.ctx, serial)
	})
}

func (a *App) PushScrcpyClipboard(serial string, text string) error {
	return auditVoidAction(a, "push_scrcpy_clipboard", func() error {
		return a.scrSvc.PushClipboard(serial, text)
	})
}

func (a *App) GetScrcpyClipboard(serial string) (string, error) {
	return auditAction(a, "get_scrcpy_clipboard", func() (string, error) {
		return a.scrSvc.GetClipboard(serial)
	})
}

func (a *App) SelectSavePath(defaultFilename string) (string, error) {
	return a.diaSvc.SelectSaveFile(defaultFilename)
}
