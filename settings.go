package main

import (
	"ADBKit/internal/audit"
	"ADBKit/internal/core"
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"strings"
)

func (a *App) GetAuditLogs(limit int) []audit.Entry {
	if a.auditLog == nil {
		return []audit.Entry{}
	}
	return a.auditLog.EntriesWithLimit(limit)
}

func (a *App) ClearAuditLogs() {
	if a.auditLog == nil {
		return
	}
	a.auditLog.Clear()
	a.auditLog.Log(audit.LogLevelInfo, "audit_logs", "Audit logs cleared")
}

func (a *App) ExportAuditLogs(path string) error {
	if a.auditLog == nil {
		return core.NewOperationError("export_audit_logs", "audit log is not available", "", false)
	}
	if strings.TrimSpace(path) == "" {
		return core.NewOperationError("export_audit_logs", "export path is required", "", false)
	}
	entries := a.auditLog.EntriesWithLimit(0)
	data, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return core.NewOperationError("export_audit_logs", "failed to marshal audit entries", err.Error(), true)
	}
	if err := os.WriteFile(path, data, 0o600); err != nil {
		return core.NewOperationError("export_audit_logs", "failed to write export file", err.Error(), true)
	}
	a.auditLog.Log(audit.LogLevelInfo, "audit_logs", fmt.Sprintf("Audit logs exported to %s", path))
	return nil
}

func (a *App) ImportAuditLogs(path string) (int, error) {
	if a.auditLog == nil {
		return 0, core.NewOperationError("import_audit_logs", "audit log is not available", "", false)
	}
	if strings.TrimSpace(path) == "" {
		return 0, core.NewOperationError("import_audit_logs", "import path is required", "", false)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return 0, core.NewOperationError("import_audit_logs", "failed to read import file", err.Error(), true)
	}
	var entries []audit.Entry
	if err := json.Unmarshal(data, &entries); err != nil {
		return 0, core.NewOperationError("import_audit_logs", "import file is not a valid audit log", err.Error(), false)
	}
	if err := a.auditLog.ReplaceAll(entries); err != nil {
		return 0, core.NewOperationError("import_audit_logs", "failed to apply import", err.Error(), true)
	}
	a.auditLog.Log(audit.LogLevelInfo, "audit_logs", fmt.Sprintf("Audit logs imported from %s", path))
	return len(entries), nil
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
	if trimmed := strings.TrimSpace(payload.DefaultTerminalMode); trimmed != "" {
		a.cfg.DefaultTerminalMode = trimmed
	}
	a.cfg.AutoRefreshDevices = payload.AutoRefreshDevices
	if payload.DeviceRefreshSeconds > 0 {
		a.cfg.DeviceRefreshSeconds = payload.DeviceRefreshSeconds
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
		AdbPath:              a.cfg.AdbPath,
		FastbootPath:         a.cfg.FastbootPath,
		ScrcpyPath:           a.cfg.ScrcpyPath,
		SetupCompleted:       a.cfg.SetupCompleted,
		Theme:                a.cfg.Theme,
		BinaryVersions:       cloneStringMap(a.cfg.BinaryVersions),
		DeviceNicknames:      cloneStringMap(a.cfg.DeviceNicknames),
		LogcatBufferLimit:    a.cfg.LogcatBufferLimit,
		ScrcpyPresets:        cloneScrcpyPresets(a.cfg.ScrcpyPresets),
		DefaultTerminalMode:  a.cfg.DefaultTerminalMode,
		AutoRefreshDevices:   a.cfg.AutoRefreshDevices,
		DeviceRefreshSeconds: a.cfg.DeviceRefreshSeconds,
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
