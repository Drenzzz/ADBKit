import {
  ClearAuditLogs,
  GetAppConfig,
  GetAuditLogs,
  GetRuntimeDiagnostics,
  UpdatePreferences,
} from '../../wailsjs/go/main/App'
import type {
  AppConfigSnapshot,
  AuditLogEntry,
  PreferencesPayload,
  RuntimeDiagnostics,
} from '@/lib/types'

export async function getAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  const raw = await GetAuditLogs(limit)
  return (raw as unknown as AuditLogEntry[]) ?? []
}

export async function clearAuditLogs(): Promise<void> {
  await ClearAuditLogs()
}

export async function getAppConfig(): Promise<AppConfigSnapshot> {
  const raw = await GetAppConfig()
  return raw as unknown as AppConfigSnapshot
}

export async function updatePreferences(
  payload: PreferencesPayload,
): Promise<AppConfigSnapshot> {
  const raw = await UpdatePreferences(payload as never)
  return raw as unknown as AppConfigSnapshot
}

export async function getRuntimeDiagnostics(): Promise<RuntimeDiagnostics> {
  const raw = await GetRuntimeDiagnostics()
  return raw as unknown as RuntimeDiagnostics
}
