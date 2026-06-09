import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clearAuditLogs, getAuditLogs } from '@/services/settingsService'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { AuditLogEntry, AuditLogFilters } from '@/lib/types'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

function matchesFilters(
  entry: AuditLogEntry,
  filters: AuditLogFilters,
): boolean {
  if (!filters.levels.includes(entry.level)) {
    return false
  }
  if (filters.success === 'success' && !entry.success) {
    return false
  }
  if (filters.success === 'failed' && entry.success) {
    return false
  }
  if (
    filters.operation.trim() !== '' &&
    !entry.operation
      .toLowerCase()
      .includes(filters.operation.trim().toLowerCase())
  ) {
    return false
  }
  const searchText = filters.text.trim().toLowerCase()
  if (searchText === '') {
    return true
  }
  return [entry.operation, entry.message, entry.details ?? '']
    .join(' ')
    .toLowerCase()
    .includes(searchText)
}

const auditLogQueryKey = (limit: number) =>
  ['settings', 'audit-logs', limit] as const

export function useAuditLogs() {
  const queryClient = useQueryClient()
  const auditLogs = useSettingsStore((state) => state.auditLogs)
  const auditLogLimit = useSettingsStore((state) => state.auditLogLimit)
  const auditLogFilters = useSettingsStore((state) => state.auditLogFilters)
  const selectedAuditLogId = useSettingsStore(
    (state) => state.selectedAuditLogId,
  )
  const loadingAuditLogs = useSettingsStore((state) => state.loadingAuditLogs)
  const clearingAuditLogs = useSettingsStore((state) => state.clearingAuditLogs)
  const error = useSettingsStore((state) => state.auditLogsError)
  const setAuditLogs = useSettingsStore((state) => state.setAuditLogs)
  const setSelectedAuditLogId = useSettingsStore(
    (state) => state.setSelectedAuditLogId,
  )
  const setLoadingAuditLogs = useSettingsStore(
    (state) => state.setLoadingAuditLogs,
  )
  const setClearingAuditLogs = useSettingsStore(
    (state) => state.setClearingAuditLogs,
  )
  const setAuditLogsError = useSettingsStore((state) => state.setAuditLogsError)
  const setAuditLogsLoadedAt = useSettingsStore(
    (state) => state.setAuditLogsLoadedAt,
  )

  const auditLogQuery = useQuery({
    queryKey: auditLogQueryKey(auditLogLimit),
    queryFn: () => getAuditLogs(auditLogLimit),
  })

  useEffect(() => {
    setLoadingAuditLogs(auditLogQuery.isLoading || auditLogQuery.isFetching)
    if (auditLogQuery.data) {
      setAuditLogs(auditLogQuery.data)
      setAuditLogsLoadedAt(Date.now())
      if (auditLogQuery.data.length === 0) {
        setSelectedAuditLogId(null)
      } else if (
        !auditLogQuery.data.some((entry) => entry.id === selectedAuditLogId)
      ) {
        setSelectedAuditLogId(auditLogQuery.data[0]?.id ?? null)
      }
      setAuditLogsError(null)
    }
    if (auditLogQuery.error) {
      setAuditLogsError(
        getErrorMessage(auditLogQuery.error, 'Failed to load audit logs'),
      )
    }
  }, [
    auditLogQuery.data,
    auditLogQuery.error,
    auditLogQuery.isFetching,
    auditLogQuery.isLoading,
    selectedAuditLogId,
    setAuditLogs,
    setAuditLogsLoadedAt,
    setAuditLogsError,
    setLoadingAuditLogs,
    setSelectedAuditLogId,
  ])

  const clearLogsMutation = useMutation({
    mutationFn: clearAuditLogs,
    onSuccess: () => {
      queryClient.setQueryData(auditLogQueryKey(auditLogLimit), [])
      setAuditLogs([])
      setSelectedAuditLogId(null)
      setAuditLogsLoadedAt(Date.now())
      setAuditLogsError(null)
    },
    onError: (clearError) => {
      setAuditLogsError(getErrorMessage(clearError, 'Failed to clear audit logs'))
    },
  })

  useEffect(() => {
    setClearingAuditLogs(clearLogsMutation.isPending)
  }, [clearLogsMutation.isPending, setClearingAuditLogs])

  async function clearLogs() {
    setAuditLogsError(null)
    return clearLogsMutation
      .mutateAsync()
      .then(() => true)
      .catch(() => false)
  }

  const filteredLogs = useMemo(() => {
    const nextLogs = auditLogs.filter((entry) => matchesFilters(entry, auditLogFilters))
    return [...nextLogs].sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
  }, [auditLogs, auditLogFilters])

  const selectedEntry = useMemo(
    () =>
      filteredLogs.find((entry) => entry.id === selectedAuditLogId) ??
      filteredLogs[0] ??
      null,
    [filteredLogs, selectedAuditLogId],
  )

  const availableOperations = useMemo(
    () =>
      Array.from(new Set(auditLogs.map((entry) => entry.operation))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [auditLogs],
  )

  return {
    auditLogs,
    filteredLogs,
    auditLogLimit,
    auditLogFilters,
    selectedAuditLogId,
    selectedEntry,
    loadingAuditLogs,
    clearingAuditLogs,
    error,
    availableOperations,
    setSelectedAuditLogId,
    loadAuditLogs: () =>
      queryClient.invalidateQueries({ queryKey: auditLogQueryKey(auditLogLimit) }),
    clearLogs,
  }
}
