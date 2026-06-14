import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAppManagerStore } from '@/stores/useAppManagerStore'
import { useDeviceStore } from '@/stores/useDeviceStore'
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
import type { PackageDetails, DeviceSummary } from '@/lib/types'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Operation failed'
}

function isReadyAdbDevice(d: DeviceSummary): boolean {
  return d.mode === 'adb' && d.state === 'device'
}

export function useAppManager() {
  const store = useAppManagerStore()
  const { devices, activeSerial } = useDeviceStore()
  const [detailsCache, setDetailsCache] = useState<Map<string, PackageDetails>>(new Map())
  const pendingDetailsRef = useRef<Set<string>>(new Set())

  const hasReadyAdbDevice = useMemo(
    () => devices.some(isReadyAdbDevice),
    [devices],
  )

  const hasReadyActiveDevice = useMemo(
    () => devices.some((d) => d.serial === activeSerial && isReadyAdbDevice(d)),
    [activeSerial, devices],
  )

  const fetchPackages = useCallback(
    async (isRefresh = false) => {
      if (!hasReadyAdbDevice || !hasReadyActiveDevice) {
        store.setPackages([])
        store.clearSelection()
        store.setLastUpdatedAt(null)
        store.setError('No ADB device connected')
        store.setLoading(false)
        store.setRefreshing(false)
        return
      }

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
    [store, hasReadyAdbDevice, hasReadyActiveDevice],
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

    switch (store.sortOrder) {
      case 'za':
        result.sort((a, b) => b.packageName.localeCompare(a.packageName))
        break
      case 'size-desc':
        result.sort((a, b) => {
          const sizeA = detailsCache.get(a.packageName)?.totalSizeBytes ?? -1
          const sizeB = detailsCache.get(b.packageName)?.totalSizeBytes ?? -1
          return sizeB - sizeA
        })
        break
      case 'size-asc':
        result.sort((a, b) => {
          const sizeA = detailsCache.get(a.packageName)?.totalSizeBytes ?? -1
          const sizeB = detailsCache.get(b.packageName)?.totalSizeBytes ?? -1
          return sizeA - sizeB
        })
        break
      default:
        result.sort((a, b) => a.packageName.localeCompare(b.packageName))
    }

    return result
  }, [store.packages, store.statusFilter, store.searchTerm, store.sortOrder, detailsCache])

  const isSizeSort = store.sortOrder === 'size-desc' || store.sortOrder === 'size-asc'

  useEffect(() => {
    if (!isSizeSort || filteredPackages.length === 0) return

    const uncached = filteredPackages
      .filter((pkg) => !detailsCache.has(pkg.packageName) && !pendingDetailsRef.current.has(pkg.packageName))
      .slice(0, 20)

    if (uncached.length === 0) return

    for (const pkg of uncached) {
      pendingDetailsRef.current.add(pkg.packageName)
    }

    void Promise.allSettled(
      uncached.map(async (pkg) => {
        try {
          const details = await svcGetDetails(pkg.packageName)
          if (details) {
            setDetailsCache((prev) => {
              const next = new Map(prev)
              next.set(pkg.packageName, details)
              return next
            })
          }
        } finally {
          pendingDetailsRef.current.delete(pkg.packageName)
        }
      }),
    )
  }, [isSizeSort, filteredPackages])

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

  const installApkFromPath = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        store.setInstalling(true)
        const message = await svcInstallPackage(filePath)
        toast.success(message)
        await fetchPackages(true)
        return true
      } catch (err) {
        toast.error(getErrorMessage(err))
        return false
      } finally {
        store.setInstalling(false)
      }
    },
    [fetchPackages],
  )

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

  const forceStopBatch = useCallback(async () => {
    const names = store.selectedPackages
    if (names.length === 0) return

    store.setBusyBatchAction('force-stop')
    let successCount = 0
    const failures: string[] = []
    for (const name of names) {
      try {
        await svcForceStop(name)
        successCount++
      } catch (err) {
        failures.push(`${name}: ${getErrorMessage(err)}`)
      }
    }
    store.setBusyBatchAction(null)

    if (failures.length === 0) {
      toast.success(`Successfully stopped ${successCount} package(s)`)
    } else if (successCount === 0) {
      toast.error(`Failed to stop ${failures.length} package(s)`, {
        description: failures.slice(0, 3).join('\n'),
      })
    } else {
      toast.warning(`Stopped ${successCount}, failed ${failures.length}`, {
        description: failures.slice(0, 3).join('\n'),
      })
    }
    store.clearSelection()
  }, [])

  const clearDataBatch = useCallback(async () => {
    const names = store.selectedPackages
    if (names.length === 0) return

    store.setBusyBatchAction('clear-data')
    let successCount = 0
    const failures: string[] = []
    for (const name of names) {
      try {
        await svcClearData(name)
        successCount++
      } catch (err) {
        failures.push(`${name}: ${getErrorMessage(err)}`)
      }
    }
    store.setBusyBatchAction(null)

    if (failures.length === 0) {
      toast.success(`Successfully cleared data for ${successCount} package(s)`)
    } else if (successCount === 0) {
      toast.error(`Failed to clear data for ${failures.length} package(s)`, {
        description: failures.slice(0, 3).join('\n'),
      })
    } else {
      toast.warning(`Cleared ${successCount}, failed ${failures.length}`, {
        description: failures.slice(0, 3).join('\n'),
      })
    }
    store.clearSelection()
  }, [])

  const exportApkBatch = useCallback(async () => {
    const names = store.selectedPackages
    if (names.length === 0) return

    store.setBusyBatchAction('pull-apk')
    let successCount = 0
    const failures: string[] = []
    for (const name of names) {
      try {
        await svcPullApk(name)
        successCount++
      } catch (err) {
        failures.push(`${name}: ${getErrorMessage(err)}`)
      }
    }
    store.setBusyBatchAction(null)

    if (failures.length === 0) {
      toast.success(`Successfully exported ${successCount} APK(s)`)
    } else if (successCount === 0) {
      toast.error(`Failed to export ${failures.length} APK(s)`, {
        description: failures.slice(0, 3).join('\n'),
      })
    } else {
      toast.warning(`Exported ${successCount}, failed ${failures.length}`, {
        description: failures.slice(0, 3).join('\n'),
      })
    }
    store.clearSelection()
  }, [])

  const clearData = useCallback(
    async (packageName: string) => {
      store.setBusyPackageName(packageName)
      try {
        const message = await svcClearData(packageName)
        toast.success(message)
        void fetchPackages(true)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        store.setBusyPackageName(null)
      }
    },
    [fetchPackages],
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
    installApkFromPath,
    uninstallSingle,
    uninstallBatch,
    enableSingle,
    enableBatch,
    disableSingle,
    disableBatch,
    forceStopBatch,
    clearDataBatch,
    exportApkBatch,
    clearData,
    pullApk,
    launch,
    forceStop,
    getDetails,
  }
}
