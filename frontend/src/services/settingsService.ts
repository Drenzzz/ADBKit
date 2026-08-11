import {
  ClearAuditLogs,
  ExportAuditLogs,
  GetAppConfig,
  GetAuditLogs,
  GetRuntimeDiagnostics,
  ImportAuditLogs,
  UpdatePreferences,
} from '../../bindings/ADBKit/internal/app/app'
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

export async function exportAuditLogs(path: string): Promise<void> {
  await ExportAuditLogs(path)
}

export async function importAuditLogs(path: string): Promise<number> {
  const raw = await ImportAuditLogs(path)
  return (raw as number) ?? 0
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

export const AUDIT_LOG_LIMIT_OPTIONS = [50, 100, 200, 500, 1000] as const

export type AuditLogLimitOption = (typeof AUDIT_LOG_LIMIT_OPTIONS)[number]
