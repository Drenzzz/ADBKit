import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAppConfig,
  getWindowState,
  setWindowState,
  updatePreferences,
  type WindowStateOption,
} from '@/services/settingsService'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { AppConfigSnapshot, PreferencesPayload } from '@/lib/types'

const settingsQueryKeys = {
  config: ['settings', 'config'] as const,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

function configsAreEqual(a: PreferencesPayload, b: AppConfigSnapshot): boolean {
  if (a.theme !== (b.theme === 'light' ? 'light' : 'dark')) return false
  if ((a.logcat_buffer_limit ?? 5000) !== (b.logcat_buffer_limit ?? 5000)) return false
  if (JSON.stringify(a.device_nicknames ?? {}) !== JSON.stringify(b.device_nicknames ?? {})) return false
  if (JSON.stringify(a.scrcpy_presets ?? []) !== JSON.stringify(b.scrcpy_presets ?? [])) return false
  if ((a.default_terminal_mode ?? 'adb-shell') !== (b.default_terminal_mode ?? 'adb-shell')) return false
  if ((a.auto_refresh_devices ?? true) !== (b.auto_refresh_devices ?? true)) return false
  if ((a.device_refresh_seconds ?? 8) !== (b.device_refresh_seconds ?? 8)) return false
  if ((a.audit_enabled ?? false) !== (b.audit_enabled ?? false)) return false
  return true
}

export function useSettings() {
  const queryClient = useQueryClient()
  const appConfig = useSettingsStore((state) => state.appConfig)
  const preferencesDraft = useSettingsStore((state) => state.preferencesDraft)
  const loadingConfig = useSettingsStore((state) => state.loadingConfig)
  const savingPreferences = useSettingsStore((state) => state.savingPreferences)
  const preferencesError = useSettingsStore((state) => state.preferencesError)
  const setAppConfig = useSettingsStore((state) => state.setAppConfig)
  const setPreferencesDraft = useSettingsStore((state) => state.setPreferencesDraft)
  const hydratePreferencesDraft = useSettingsStore((state) => state.hydratePreferencesDraft)
  const setLoadingConfig = useSettingsStore((state) => state.setLoadingConfig)
  const setSavingPreferences = useSettingsStore((state) => state.setSavingPreferences)
  const setPreferencesError = useSettingsStore((state) => state.setPreferencesError)

  const configQuery = useQuery({
    queryKey: settingsQueryKeys.config,
    queryFn: getAppConfig,
  })

  const preferencesMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (nextConfig) => {
      queryClient.setQueryData(settingsQueryKeys.config, nextConfig)
      setAppConfig(nextConfig)
      hydratePreferencesDraft(nextConfig)
      setPreferencesError(null)
    },
    onError: (saveError) => {
      setPreferencesError(getErrorMessage(saveError, 'Failed to update preferences'))
    },
  })

  useEffect(() => {
    setLoadingConfig(configQuery.isLoading || configQuery.isFetching)
    if (configQuery.data) {
      setAppConfig(configQuery.data)
      hydratePreferencesDraft(configQuery.data)
      setPreferencesError(null)
    }
    if (configQuery.error) {
      setPreferencesError(getErrorMessage(configQuery.error, 'Failed to load settings config'))
    }
  }, [
    configQuery.data,
    configQuery.error,
    configQuery.isFetching,
    configQuery.isLoading,
    hydratePreferencesDraft,
    setAppConfig,
    setPreferencesError,
    setLoadingConfig,
  ])

  useEffect(() => {
    setSavingPreferences(preferencesMutation.isPending)
  }, [preferencesMutation.isPending, setSavingPreferences])

  async function savePreferences() {
    setPreferencesError(null)
    const nextConfig = await preferencesMutation
      .mutateAsync(preferencesDraft)
      .catch(() => null)
    return nextConfig !== null
  }

  function resetPreferencesDraft() {
    hydratePreferencesDraft(appConfig)
  }

  async function setTheme(theme: 'dark' | 'light') {
    if (!appConfig || appConfig.theme === theme) {
      setPreferencesDraft({ theme })
      return
    }
    setPreferencesError(null)
    const nextConfig = await preferencesMutation
      .mutateAsync({ ...preferencesDraft, theme })
      .catch(() => null)
    if (nextConfig) {
      hydratePreferencesDraft(nextConfig)
    }
  }

  const windowStateQuery = useQuery({
    queryKey: ['settings', 'window-state'] as const,
    queryFn: getWindowState,
    staleTime: 60_000,
  })

  const windowStateMutation = useMutation({
    mutationFn: (state: WindowStateOption) => setWindowState(state),
    onSuccess: (next) => {
      queryClient.setQueryData(['settings', 'window-state'], next)
    },
  })

  async function setPreferredWindowState(state: WindowStateOption) {
    await windowStateMutation.mutateAsync(state)
  }

  const hasPreferenceChanges = useMemo(() => {
    if (!appConfig) return false
    return !configsAreEqual(preferencesDraft, appConfig)
  }, [appConfig, preferencesDraft])

  return {
    appConfig,
    preferencesDraft,
    loadingConfig,
    savingPreferences,
    error: preferencesError,
    hasPreferenceChanges,
    setPreferencesDraft,
    loadConfig: () => queryClient.invalidateQueries({ queryKey: settingsQueryKeys.config }),
    savePreferences,
    resetPreferencesDraft,
    setTheme,
    windowState: windowStateQuery.data,
    setPreferredWindowState,
    savingWindowState: windowStateMutation.isPending,
  }
}
