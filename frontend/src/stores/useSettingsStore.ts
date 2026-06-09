import { create } from 'zustand'
import type {
  AppConfigSnapshot,
  AuditLogEntry,
  AuditLogFilters,
  PreferencesPayload,
  SettingsState,
} from '@/lib/types'

const initialFilters: AuditLogFilters = {
  levels: ['info', 'warning', 'error', 'debug', 'success'],
  operation: '',
  text: '',
  success: 'all',
}

const initialPreferencesDraft: PreferencesPayload = {
  theme: 'dark',
  device_nicknames: {},
  logcat_buffer_limit: 5000,
  scrcpy_presets: [],
}

const initialState: SettingsState = {
  appConfig: null,
  preferencesDraft: initialPreferencesDraft,
  auditLogs: [],
  auditLogLimit: 200,
  auditLogFilters: initialFilters,
  selectedAuditLogId: null,
  loadingConfig: false,
  savingPreferences: false,
  loadingAuditLogs: false,
  clearingAuditLogs: false,
  preferencesError: null,
  auditLogsError: null,
  auditLogsLoadedAt: null,
}

interface SettingsActions {
  setAppConfig: (config: AppConfigSnapshot | null) => void
  setPreferencesDraft: (draft: Partial<PreferencesPayload>) => void
  hydratePreferencesDraft: (config: AppConfigSnapshot | null) => void
  setAuditLogs: (logs: AuditLogEntry[]) => void
  setAuditLogLimit: (limit: number) => void
  setAuditLogFilters: (filters: Partial<AuditLogFilters>) => void
  setSelectedAuditLogId: (id: number | null) => void
  setLoadingConfig: (loading: boolean) => void
  setSavingPreferences: (saving: boolean) => void
  setLoadingAuditLogs: (loading: boolean) => void
  setClearingAuditLogs: (clearing: boolean) => void
  setPreferencesError: (error: string | null) => void
  setAuditLogsError: (error: string | null) => void
  setAuditLogsLoadedAt: (timestamp: number | null) => void
  reset: () => void
}

type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>()((set) => ({
  ...initialState,
  setAppConfig: (appConfig) => set({ appConfig }),
  setPreferencesDraft: (draft) =>
    set((state) => ({
      preferencesDraft: {
        ...state.preferencesDraft,
        ...draft,
      },
    })),
  hydratePreferencesDraft: (config) =>
    set({
      preferencesDraft: {
        theme: config?.theme === 'light' ? 'light' : 'dark',
        device_nicknames: config?.device_nicknames ?? {},
        logcat_buffer_limit: config?.logcat_buffer_limit ?? 5000,
        scrcpy_presets: config?.scrcpy_presets ?? [],
      },
    }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setAuditLogLimit: (auditLogLimit) => set({ auditLogLimit }),
  setAuditLogFilters: (filters) =>
    set((state) => ({
      auditLogFilters: {
        ...state.auditLogFilters,
        ...filters,
      },
    })),
  setSelectedAuditLogId: (selectedAuditLogId) => set({ selectedAuditLogId }),
  setLoadingConfig: (loadingConfig) => set({ loadingConfig }),
  setSavingPreferences: (savingPreferences) => set({ savingPreferences }),
  setLoadingAuditLogs: (loadingAuditLogs) => set({ loadingAuditLogs }),
  setClearingAuditLogs: (clearingAuditLogs) => set({ clearingAuditLogs }),
  setPreferencesError: (preferencesError) => set({ preferencesError }),
  setAuditLogsError: (auditLogsError) => set({ auditLogsError }),
  setAuditLogsLoadedAt: (auditLogsLoadedAt) => set({ auditLogsLoadedAt }),
  reset: () => set(initialState),
}))
