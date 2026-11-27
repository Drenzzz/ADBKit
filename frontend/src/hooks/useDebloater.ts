import { useCallback, useEffect, useMemo } from 'react'
import { toast } from '@/lib/toast'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { useDebloaterStore } from '@/stores/useDebloaterStore'
import {
  clearCustomDebloaterCatalog,
  debloatPackages,
  disableDebloatPackages,
  exportDebloaterTemplate,
  getDebloaterCatalogMeta,
  importCustomDebloaterCatalog,
  listRestorablePackages,
  restorePackages,
  scanDebloater,
  selectJsonFile,
  selectSaveJsonFile,
} from '@/services/debloaterService'
import type { DebloatBatchResult, DeviceSummary } from '@/lib/types'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Operation failed'
}

function isReadyAdbDevice(d: DeviceSummary): boolean {
  return d.mode === 'adb' && d.state === 'device'
}

function notifyBatchResult(result: DebloatBatchResult, verb: string) {
  if (result.failed === 0 && result.skipped === 0) {
    toast.success(`Successfully ${verb} ${result.succeeded} package(s)`)
    return
  }
  const firstFailure = result.results
    .filter((r) => !r.success)
    .slice(0, 3)
    .map((r) => `${r.packageName}: ${r.message}`)
    .join('\n')

  if (result.succeeded === 0) {
    toast.error(`Failed to process ${result.total} package(s)`, {
      description: firstFailure,
    })
    return
  }
  toast.warning(
    `${verb} ${result.succeeded} · failed ${result.failed}${result.skipped > 0 ? ` · blocked ${result.skipped}` : ''}`,
    { description: firstFailure },
  )
}

export function useDebloater() {
  const store = useDebloaterStore()
  const { devices, activeSerial } = useDeviceStore()

  const hasReadyActiveDevice = useMemo(
    () => devices.some((d) => d.serial === activeSerial && isReadyAdbDevice(d)),
    [activeSerial, devices],
  )

  useEffect(() => {
    useDebloaterStore.getState().resetForDeviceChange()
  }, [activeSerial])

  const loadCatalogMeta = useCallback(async () => {
    try {
      const meta = await getDebloaterCatalogMeta()
      useDebloaterStore.getState().setCatalogMeta(meta)
    } catch {
      // ignore metadata load failure
    }
  }, [])

  const scan = useCallback(async () => {
    const s = useDebloaterStore.getState()
    if (!hasReadyActiveDevice) {
      s.setScanResult(null)
      s.clearDebloatSelection()
      s.setError('No ADB device connected')
      return
    }

    s.setScanning(true)
    s.setError(null)
    try {
      const result = await scanDebloater()
      const current = useDebloaterStore.getState()
      current.setScanResult(result)
      const installedNames = new Set(result.items.map((item) => item.packageName))
      current.setSelectedDebloat(
        current.selectedDebloat.filter((name) => installedNames.has(name)),
      )
    } catch (err) {
      useDebloaterStore.getState().setError(getErrorMessage(err))
    } finally {
      useDebloaterStore.getState().setScanning(false)
    }
  }, [hasReadyActiveDevice])

  const fetchRestorable = useCallback(async () => {
    const s = useDebloaterStore.getState()
    if (!hasReadyActiveDevice) {
      s.setRestorablePackages([])
      s.clearRestoreSelection()
      s.setError('No ADB device connected')
      return
    }

    s.setLoadingRestorable(true)
    s.setError(null)
    try {
      const items = await listRestorablePackages()
      const current = useDebloaterStore.getState()
      current.setRestorablePackages(items)
      const restorableNames = new Set(items.map((item) => item.packageName))
      current.setSelectedRestore(
        current.selectedRestore.filter((name) => restorableNames.has(name)),
      )
    } catch (err) {
      useDebloaterStore.getState().setError(getErrorMessage(err))
    } finally {
      useDebloaterStore.getState().setLoadingRestorable(false)
    }
  }, [hasReadyActiveDevice])

  useEffect(() => {
    const s = useDebloaterStore.getState()
    if (s.activeMode === 'debloater' && hasReadyActiveDevice && !s.scanResult) {
      void scan()
      void loadCatalogMeta()
    } else if (
      s.activeMode === 'restore' &&
      hasReadyActiveDevice &&
      s.restorablePackages.length === 0
    ) {
      void fetchRestorable()
    }
  }, [store.activeMode, hasReadyActiveDevice, activeSerial, scan, loadCatalogMeta, fetchRestorable])

  const filteredCandidates = useMemo(() => {
    const items = store.scanResult?.items ?? []
    const term = store.searchTerm.trim().toLowerCase()

    return items.filter((item) => {
      if (store.vendorFilter !== 'all' && item.vendor !== store.vendorFilter) {
        return false
      }
      if (store.riskFilter !== 'all' && item.risk !== store.riskFilter) {
        return false
      }
      if (store.typeFilter === 'system' && !item.isSystemApp) {
        return false
      }
      if (store.typeFilter === 'user' && item.isSystemApp) {
        return false
      }
      if (!term) return true
      return (
        item.appName.toLowerCase().includes(term) ||
        item.packageName.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      )
    })
  }, [
    store.scanResult,
    store.searchTerm,
    store.vendorFilter,
    store.riskFilter,
    store.typeFilter,
  ])

  const filteredRestorable = useMemo(() => {
    const term = store.restoreSearchTerm.trim().toLowerCase()
    return store.restorablePackages.filter((item) => {
      if (store.restoreCatalogOnly && !item.inCatalog) {
        return false
      }
      if (!term) return true
      return (
        item.packageName.toLowerCase().includes(term) ||
        (item.appName ?? '').toLowerCase().includes(term) ||
        (item.category ?? '').toLowerCase().includes(term)
      )
    })
  }, [store.restorablePackages, store.restoreSearchTerm, store.restoreCatalogOnly])

  const selectedCandidateItems = useMemo(() => {
    const items = store.scanResult?.items ?? []
    const selectedSet = new Set(store.selectedDebloat)
    return items.filter((item) => selectedSet.has(item.packageName))
  }, [store.scanResult, store.selectedDebloat])

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = store.scanResult?.presets.find((p) => p.id === presetId)
      if (!preset) return
      store.setSelectedDebloat(preset.packageNames)
    },
    [store.scanResult],
  )

  const executeDebloat = useCallback(
    async (): Promise<boolean> => {
      const names = store.selectedDebloat
      if (names.length === 0) return false

      store.setExecutingAction('debloat')
      try {
        const result = await debloatPackages(names, false)
        notifyBatchResult(result, 'debloated')
        store.clearDebloatSelection()
        await Promise.all([scan(), fetchRestorable()])
        return true
      } catch (err) {
        toast.error(getErrorMessage(err))
        return false
      } finally {
        store.setExecutingAction(null)
      }
    },
    [store.selectedDebloat, scan, fetchRestorable],
  )

  const executeDisable = useCallback(async (): Promise<boolean> => {
    const names = store.selectedDebloat
    if (names.length === 0) return false

    store.setExecutingAction('disable')
    try {
      const result = await disableDebloatPackages(names)
      notifyBatchResult(result, 'disabled')
      store.clearDebloatSelection()
      await scan()
      return true
    } catch (err) {
      toast.error(getErrorMessage(err))
      return false
    } finally {
      store.setExecutingAction(null)
    }
  }, [store.selectedDebloat, scan])

  const executeRestore = useCallback(
    async (packageNames: string[]): Promise<boolean> => {
      if (packageNames.length === 0) return false

      const single = packageNames.length === 1 ? packageNames[0] : null
      if (single) {
        store.setBusyRestorePackage(single)
      } else {
        store.setExecutingAction('restore')
      }

      try {
        const result = await restorePackages(packageNames)
        notifyBatchResult(result, 'restored')
        if (!single) {
          store.clearRestoreSelection()
        } else {
          store.setSelectedRestore(
            store.selectedRestore.filter((name) => name !== single),
          )
        }
        await Promise.all([fetchRestorable(), scan()])
        return true
      } catch (err) {
        toast.error(getErrorMessage(err))
        return false
      } finally {
        store.setBusyRestorePackage(null)
        store.setExecutingAction(null)
      }
    },
    [store.selectedRestore, fetchRestorable, scan],
  )

  const importCatalog = useCallback(async () => {
    try {
      const filePath = await selectJsonFile()
      if (!filePath) return
      const meta = await importCustomDebloaterCatalog(filePath)
      store.setCatalogMeta(meta)
      toast.success(`Imported ${meta.customCount} custom package(s)`)
      await scan()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [scan])

  const clearCatalog = useCallback(async () => {
    try {
      const meta = await clearCustomDebloaterCatalog()
      store.setCatalogMeta(meta)
      toast.success('Custom catalog cleared')
      await scan()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [scan])

  const exportTemplate = useCallback(async () => {
    try {
      const filePath = await selectSaveJsonFile('debloater-custom-catalog.json')
      if (!filePath) return
      await exportDebloaterTemplate(filePath)
      toast.success('Exported JSON template')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [])

  return {
    activeMode: store.activeMode,
    scanResult: store.scanResult,
    filteredCandidates,
    filteredRestorable,
    restorableCount: store.restorablePackages.length,
    catalogMeta: store.catalogMeta,
    selectedDebloat: store.selectedDebloat,
    selectedCandidateItems,
    selectedRestore: store.selectedRestore,
    searchTerm: store.searchTerm,
    vendorFilter: store.vendorFilter,
    riskFilter: store.riskFilter,
    typeFilter: store.typeFilter,
    restoreSearchTerm: store.restoreSearchTerm,
    restoreCatalogOnly: store.restoreCatalogOnly,
    scanning: store.scanning,
    loadingRestorable: store.loadingRestorable,
    executingAction: store.executingAction,
    busyRestorePackage: store.busyRestorePackage,
    error: store.error,

    setActiveMode: store.setActiveMode,
    setSearchTerm: store.setSearchTerm,
    setVendorFilter: store.setVendorFilter,
    setRiskFilter: store.setRiskFilter,
    setTypeFilter: store.setTypeFilter,
    setRestoreSearchTerm: store.setRestoreSearchTerm,
    setRestoreCatalogOnly: store.setRestoreCatalogOnly,
    toggleDebloatSelect: store.toggleDebloatSelect,
    toggleAllDebloat: store.toggleAllDebloat,
    clearDebloatSelection: store.clearDebloatSelection,
    toggleRestoreSelect: store.toggleRestoreSelect,
    toggleAllRestore: store.toggleAllRestore,
    clearRestoreSelection: store.clearRestoreSelection,

    scan,
    fetchRestorable,
    applyPreset,
    executeDebloat,
    executeDisable,
    executeRestore,
    importCatalog,
    clearCatalog,
    exportTemplate,
  }
}
