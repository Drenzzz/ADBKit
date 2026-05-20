import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useAppManagerStore } from '@/stores/useAppManagerStore'
import {
  listPackages,
  installPackage as svcInstallPackage,
  uninstallPackage as svcUninstallPackage,
  uninstallMultiplePackages as svcUninstallBatch,
  enablePackage as svcEnablePackage,
  enableMultiplePackages as svcEnableBatch,
  disablePackage as svcDisablePackage,
  disableMultiplePackages as svcDisableBatch,
  clearPackageData as svcClearData,
  pullPackageApk as svcPullApk,
  launchPackage as svcLaunch,
  forceStopPackage as svcForceStop,
  getPackageDetails as svcGetDetails,
  selectApkFile as svcSelectApk,
} from '@/services/packageService'
import type { PackageDetails, PackageInfo } from '@/lib/types'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Operation failed'
}

export function useAppManager() {
  const store = useAppManagerStore()

  const fetchPackages = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        store.setRefreshing(true)
      } else {
        store.setLoading(true)
      }
      store.setError(null)

      try {
        const packages = await listPackages(store.filter)
        store.setPackages(packages)
        store.setLastUpdatedAt(Date.now())
      } catch (err) {
        store.setError(getErrorMessage(err))
      } finally {
        store.setLoading(false)
        store.setRefreshing(false)
      }
    },
    [store],
  )

  useEffect(() => {
    void fetchPackages()
  }, [store.filter])

  const filteredPackages = useMemo(() => {
    let result = [...store.packages]

    if (store.statusFilter === 'enabled') {
      result = result.filter((pkg) => pkg.isEnabled)
    } else if (store.statusFilter === 'disabled') {
      result = result.filter((pkg) => !pkg.isEnabled)
    }

    if (store.searchTerm.trim()) {
      const term = store.searchTerm.toLowerCase()
      result = result.filter((pkg) =>
        pkg.packageName.toLowerCase().includes(term),
      )
    }

    if (store.sortOrder === 'za') {
      result.sort((a, b) => b.packageName.localeCompare(a.packageName))
    } else {
      result.sort((a, b) => a.packageName.localeCompare(b.packageName))
    }

    return result
  }, [store.packages, store.statusFilter, store.searchTerm, store.sortOrder])

  const installApk = useCallback(async () => {
    try {
      const filePath = await svcSelectApk()
      if (!filePath) return

      store.setInstalling(true)
      const message = await svcInstallPackage(filePath)
      toast.success(message)
      await fetchPackages(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      store.setInstalling(false)
    }
  }, [fetchPackages])

  const uninstallSingle = useCallback(
    async (packageName: string) => {
      store.setBusyPackageName(packageName)
      try {
        const message = await svcUninstallPackage(packageName)
        toast.success(message)
        store.togglePackageSelection(packageName)
        await fetchPackages(true)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        store.setBusyPackageName(null)
      }
    },
    [fetchPackages],
  )

  const uninstallBatch = useCallback(async () => {
    const names = store.selectedPackages
    if (names.length === 0) return

    store.setBusyBatchAction('uninstall')
    try {
      const message = await svcUninstallBatch(names)
      toast.success(message)
      store.clearSelection()
      await fetchPackages(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      store.setBusyBatchAction(null)
    }
  }, [fetchPackages])

  const enableSingle = useCallback(
    async (packageName: string) => {
      store.setBusyPackageName(packageName)
      try {
        const message = await svcEnablePackage(packageName)
        toast.success(message)
        await fetchPackages(true)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        store.setBusyPackageName(null)
      }
    },
    [fetchPackages],
  )

  const enableBatch = useCallback(async () => {
    const names = store.selectedPackages
    if (names.length === 0) return

    store.setBusyBatchAction('enable')
    try {
      const message = await svcEnableBatch(names)
      toast.success(message)
      store.clearSelection()
      await fetchPackages(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      store.setBusyBatchAction(null)
    }
  }, [fetchPackages])

  const disableSingle = useCallback(
    async (packageName: string) => {
      store.setBusyPackageName(packageName)
      try {
        const message = await svcDisablePackage(packageName)
        toast.success(message)
        await fetchPackages(true)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        store.setBusyPackageName(null)
      }
    },
    [fetchPackages],
  )

  const disableBatch = useCallback(async () => {
    const names = store.selectedPackages
    if (names.length === 0) return

    store.setBusyBatchAction('disable')
    try {
      const message = await svcDisableBatch(names)
      toast.success(message)
      store.clearSelection()
      await fetchPackages(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      store.setBusyBatchAction(null)
    }
  }, [fetchPackages])

  const clearData = useCallback(
    async (packageName: string) => {
      store.setBusyPackageName(packageName)
      try {
        const message = await svcClearData(packageName)
        toast.success(message)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        store.setBusyPackageName(null)
      }
    },
    [],
  )

  const pullApk = useCallback(
    async (packageName: string) => {
      store.setBusyPackageName(packageName)
      try {
        const message = await svcPullApk(packageName)
        toast.success(message)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        store.setBusyPackageName(null)
      }
    },
    [],
  )

  const launch = useCallback(
    async (packageName: string) => {
      try {
        const message = await svcLaunch(packageName)
        toast.success(message)
      } catch (err) {
        toast.error(getErrorMessage(err))
      }
    },
    [],
  )

  const forceStop = useCallback(
    async (packageName: string) => {
      store.setBusyPackageName(packageName)
      try {
        const message = await svcForceStop(packageName)
        toast.success(message)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        store.setBusyPackageName(null)
      }
    },
    [],
  )

  const getDetails = useCallback(
    async (packageName: string): Promise<PackageDetails | null> => {
      try {
        return await svcGetDetails(packageName)
      } catch (err) {
        toast.error(getErrorMessage(err))
        return null
      }
    },
    [],
  )

  return {
    packages: filteredPackages,
    allPackages: store.packages,
    filter: store.filter,
    statusFilter: store.statusFilter,
    sortOrder: store.sortOrder,
    searchTerm: store.searchTerm,
    selectedPackages: store.selectedPackages,
    loading: store.loading,
    refreshing: store.refreshing,
    installing: store.installing,
    busyPackageName: store.busyPackageName,
    busyBatchAction: store.busyBatchAction,
    error: store.error,
    lastUpdatedAt: store.lastUpdatedAt,

    setFilter: store.setFilter,
    setStatusFilter: store.setStatusFilter,
    setSortOrder: store.setSortOrder,
    setSearchTerm: store.setSearchTerm,
    togglePackageSelection: store.togglePackageSelection,
    toggleVisibleSelection: store.toggleVisibleSelection,
    clearSelection: store.clearSelection,

    fetchPackages,
    installApk,
    uninstallSingle,
    uninstallBatch,
    enableSingle,
    enableBatch,
    disableSingle,
    disableBatch,
    clearData,
    pullApk,
    launch,
    forceStop,
    getDetails,
  }
}
