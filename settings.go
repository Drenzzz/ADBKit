package main

import (
	"ADBKit/internal/audit"
	"ADBKit/internal/core"
	"runtime"
	"strings"
)

func (a *App) GetAuditLogs(limit int) []audit.Entry {
	if a.auditLog == nil {
		return []audit.Entry{}
	}
	return a.auditLog.Entries()
}

func (a *App) ClearAuditLogs() {
	if a.auditLog == nil {
		return
	}
	a.auditLog.Clear()
	a.auditLog.Log(audit.LogLevelInfo, "audit_logs", "Audit logs cleared")
}

func (a *App) GetAppConfig() core.AppConfigSnapshot {
	a.mu.Lock()
	cfg := a.cfg
	a.mu.Unlock()

	if cfg == nil {
		return core.AppConfigSnapshot{}
	}

	return core.AppConfigSnapshot{
		AdbPath:           cfg.AdbPath,
		FastbootPath:      cfg.FastbootPath,
		ScrcpyPath:        cfg.ScrcpyPath,
		SetupCompleted:    cfg.SetupCompleted,
		Theme:             cfg.Theme,
		BinaryVersions:    cloneStringMap(cfg.BinaryVersions),
		DeviceNicknames:   cloneStringMap(cfg.DeviceNicknames),
		LogcatBufferLimit: cfg.LogcatBufferLimit,
		ScrcpyPresets:     cloneScrcpyPresets(cfg.ScrcpyPresets),
	}
}

func (a *App) UpdatePreferences(payload core.PreferencesPayload) (core.AppConfigSnapshot, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.cfg == nil {
		return core.AppConfigSnapshot{}, core.NewOperationError("update_preferences", "app config is not available", "", false)
	}

	if trimmed := strings.TrimSpace(strings.ToLower(payload.Theme)); trimmed != "" {
		if trimmed != core.ThemeDark && trimmed != core.ThemeLight {
			return core.AppConfigSnapshot{}, core.NewOperationError("update_preferences", "invalid theme value", payload.Theme, false)
		}
		a.cfg.Theme = trimmed
	}
	if payload.DeviceNicknames != nil {
		a.cfg.DeviceNicknames = cloneStringMap(payload.DeviceNicknames)
	}
	if payload.LogcatBufferLimit > 0 {
		a.cfg.LogcatBufferLimit = payload.LogcatBufferLimit
	}
	if payload.ScrcpyPresets != nil {
		a.cfg.ScrcpyPresets = cloneScrcpyPresets(payload.ScrcpyPresets)
	}

	if err := core.SaveConfig(a.dataDir, a.cfg); err != nil {
		return core.AppConfigSnapshot{}, err
	}

	if a.auditLog != nil {
		a.auditLog.Log(audit.LogLevelInfo, "preferences_update", "Preferences updated")
	}

	return a.GetAppConfig(), nil
}

func (a *App) GetRuntimeDiagnostics() core.RuntimeDiagnostics {
	a.mu.Lock()
	managedBinaryDir := ""
	if a.binSvc != nil {
		managedBinaryDir = a.binSvc.GetManagedBinaryDir()
	}
	snapshot := a.GetAppConfig()
	a.mu.Unlock()

	return core.RuntimeDiagnostics{
		OS:               runtime.GOOS,
		Arch:             runtime.GOARCH,
		DataDir:          a.dataDir,
		ConfigPath:       a.dataDir + "/config.json",
		ManagedBinaryDir: managedBinaryDir,
		SetupCompleted:   snapshot.SetupCompleted,
		Theme:            snapshot.Theme,
		BinaryVersions:   cloneStringMap(snapshot.BinaryVersions),
		Capabilities:     a.GetCapabilities(),
	}
}

func cloneStringMap(input map[string]string) map[string]string {
	out := make(map[string]string, len(input))
	for k, v := range input {
		out[k] = v
	}
	return out
}

func cloneScrcpyPresets(input []core.ScrcpyPreset) []core.ScrcpyPreset {
	if input == nil {
		return []core.ScrcpyPreset{}
	}
	out := make([]core.ScrcpyPreset, len(input))
	copy(out, input)
	return out
}
