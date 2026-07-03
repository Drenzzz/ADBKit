package main

import (
	"ADBKit/internal/shell"
	"os"
)

func (a *App) StartTerminal(serial string) (*shell.Session, error) {
	return auditAction(a, "start_terminal_session", func() (*shell.Session, error) {
		return a.termSvc.StartSession(a.ctx, serial)
	})
}

func (a *App) StartTerminalSession(mode string, serial string, initialArgs string) (*shell.Session, error) {
	return auditAction(a, "start_terminal_session", func() (*shell.Session, error) {
		return a.termSvc.StartSessionWithMode(a.ctx, mode, serial, initialArgs)
	})
}

func (a *App) SendTerminalInput(sessionID string, input string) error {
	return auditVoidAction(a, "send_terminal_input", func() error {
		return a.termSvc.SendInput(sessionID, input)
	})
}

func (a *App) CloseTerminal(sessionID string) error {
	return auditVoidAction(a, "close_terminal_session", func() error {
		return a.termSvc.CloseSession(sessionID)
	})
}

func (a *App) StartLogcat(serial string, levels string, tagFilter string) error {
	return auditVoidAction(a, "start_logcat_stream", func() error {
		return a.logSvc.StartStream(a.ctx, serial, levels, tagFilter)
	})
}

func (a *App) StopLogcat(serial string) error {
	return auditVoidAction(a, "stop_logcat_stream", func() error {
		return a.logSvc.StopStream(serial)
	})
}

func (a *App) SaveLogcatToFile(content string, defaultFilename string) error {
	return auditVoidAction(a, "save_logcat_to_file", func() error {
		path, err := a.diaSvc.SelectSaveFile(defaultFilename)
		if err != nil {
			return err
		}
		if path == "" {
			return nil
		}
		return os.WriteFile(path, []byte(content), 0o600)
	})
}
