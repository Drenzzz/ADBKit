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
	defer a.mu.Unlock()
	return a.snapshotConfigLocked()
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

	return a.snapshotConfigLocked(), nil
}

func (a *App) GetRuntimeDiagnostics() core.RuntimeDiagnostics {
	managedBinaryDir := ""
	if a.binSvc != nil {
		managedBinaryDir = a.binSvc.GetManagedBinaryDir()
	}

	a.mu.Lock()
	snapshot := a.snapshotConfigLocked()
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

func (a *App) snapshotConfigLocked() core.AppConfigSnapshot {
	if a.cfg == nil {
		return core.AppConfigSnapshot{}
	}
	return core.AppConfigSnapshot{
		AdbPath:           a.cfg.AdbPath,
		FastbootPath:      a.cfg.FastbootPath,
		ScrcpyPath:        a.cfg.ScrcpyPath,
		SetupCompleted:    a.cfg.SetupCompleted,
		Theme:             a.cfg.Theme,
		BinaryVersions:    cloneStringMap(a.cfg.BinaryVersions),
		DeviceNicknames:   cloneStringMap(a.cfg.DeviceNicknames),
		LogcatBufferLimit: a.cfg.LogcatBufferLimit,
		ScrcpyPresets:     cloneScrcpyPresets(a.cfg.ScrcpyPresets),
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
