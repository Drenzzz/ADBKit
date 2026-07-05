import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import * as fastbootSvc from '@/services/fastbootService'
import * as deviceSvc from '@/services/deviceService'
import { useFlasherStore } from '@/stores/useFlasherStore'
import type { FlasherMode } from '@/lib/types'

const POLL_INTERVAL = 4000

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred'
}

export function useFlasher() {
  const store = useFlasherStore()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slotLoadedRef = useRef<string>('')
  // Prevents polling from changing mode or showing error toasts during active operations
  const operationInProgressRef = useRef(false)

  const isAnyOperationRunning =
    store.runningFlash ||
    store.runningBatchFlash ||
    store.runningWipe ||
    store.runningSideload ||
    store.runningSlotChange

  useEffect(() => {
    operationInProgressRef.current = isAnyOperationRunning
  }, [isAnyOperationRunning])

  useEffect(() => {
    const unsub = fastbootSvc.onFlashStepStatus((event) => {
      const status = event.status === 'flashing' ? 'running' : event.status
      store.setFlashPlanStepStatus(event.partition, status, event.message || null)
    })
    return unsub
  }, [])

  const syncDevices = useCallback(
    async (isBackground = false) => {
      if (operationInProgressRef.current) return

      if (isBackground) {
        store.setRefreshingDevices(true)
      } else {
        store.setLoadingDevices(true)
      }

      try {
        const [fbDevices, adbDevices] = await Promise.allSettled([
          fastbootSvc.getFastbootDevices(),
          deviceSvc.getDevices(),
        ])

        const fastbootList = fbDevices.status === 'fulfilled' ? fbDevices.value : []
        const adbList = adbDevices.status === 'fulfilled' ? adbDevices.value : []

        store.setFastbootDevices(fastbootList)

        const currentSerial = store.activeFastbootSerial

        if (fastbootList.length > 0) {
          const stillConnected = currentSerial && fastbootList.some((d) => d.serial === currentSerial)
          if (!stillConnected) {
            store.setActiveFastbootSerial(fastbootList[0].serial)
          }
          const mode: FlasherMode = store.isUserspace ? 'fastbootd' : 'fastboot'
          store.setDeviceMode(mode)
        } else if (adbList.length > 0) {
          const sideloadDevice = adbList.find((d) => d.state === 'sideload')
          if (sideloadDevice) {
            store.setActiveFastbootSerial(sideloadDevice.serial)
            store.setDeviceMode('sideload')
          } else {
            store.setDeviceMode(null)
          }
        } else {
          store.setDeviceMode(null)
          store.setActiveFastbootSerial('')
        }

        store.setLastUpdatedAt(Date.now())
        store.setError(null)
      } catch (err) {
        // Suppress error state updates during active operations to avoid toast spam
        if (!operationInProgressRef.current) {
          store.setError(getErrorMessage(err))
        }
      } finally {
        store.setLoadingDevices(false)
        store.setRefreshingDevices(false)
      }
    },
    [store.activeFastbootSerial, store.isUserspace],
  )

  useEffect(() => {
    let active = true

    async function poll() {
      if (!active) return
      await syncDevices(false)
    }

    poll()
    pollRef.current = setInterval(() => {
      if (active) syncDevices(true)
    }, POLL_INTERVAL)

    return () => {
      active = false
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [syncDevices])

  useEffect(() => {
    const serial = store.activeFastbootSerial
    const mode = store.deviceMode
    if (!serial || mode === 'sideload') {
      slotLoadedRef.current = ''
      return
    }
    if (slotLoadedRef.current === serial) return

    slotLoadedRef.current = serial
    fastbootSvc
      .getActiveSlot(serial)
      .then((slot) => store.setCurrentSlot(slot))
      .catch(() => store.setCurrentSlot(''))

    fastbootSvc
      .isUserspaceFastboot(serial)
      .then((isU) => {
        store.setIsUserspace(isU)
        if (isU) store.setDeviceMode('fastbootd')
        else store.setDeviceMode('fastboot')
      })
      .catch(() => store.setIsUserspace(false))
  }, [store.activeFastbootSerial, store.deviceMode])

  const chooseImageFile = useCallback(async () => {
    try {
      const path = await fastbootSvc.selectFlashImageFile()
      if (path) store.setSelectedImagePath(path)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [])

  const chooseSideloadFile = useCallback(async () => {
    try {
      const path = await fastbootSvc.selectSideloadFile()
      if (path) store.setSideloadFilePath(path)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [])

  const chooseRomFolder = useCallback(async () => {
    try {
      const path = await fastbootSvc.selectRomFolder()
      if (path) store.setRomFolderPath(path)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [])

  const loadActiveSlot = useCallback(async () => {
    const serial = store.activeFastbootSerial
    if (!serial) return
    try {
      const slot = await fastbootSvc.getActiveSlot(serial)
      store.setCurrentSlot(slot)
    } catch {
      store.setCurrentSlot('')
    }
  }, [store.activeFastbootSerial])

  const applyActiveSlot = useCallback(
    async (slot: string) => {
      const serial = store.activeFastbootSerial
      if (!serial) return
      if (operationInProgressRef.current) return
      store.setRunningSlotChange(true)
      try {
        await fastbootSvc.setActiveSlot(serial, slot)
        store.setCurrentSlot(slot)
        toast.success(`Active slot changed to ${slot.toUpperCase()}`)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        store.setRunningSlotChange(false)
      }
    },
    [store.activeFastbootSerial],
  )

  const scanSelectedRomFolder = useCallback(async () => {
    const folderPath = store.romFolderPath
    if (!folderPath) {
      toast.error('Select a ROM folder first')
      return
    }
    store.setScanningPlan(true)
    try {
      const plan = await fastbootSvc.scanRomFolder(folderPath)
      store.setFlashPlan(plan)
      toast.success(`Found ${plan.steps.length} partition(s) in ROM folder`)
    } catch (err) {
      toast.error(getErrorMessage(err))
      store.setFlashPlan(null)
    } finally {
      store.setScanningPlan(false)
    }
  }, [store.romFolderPath])

  const executeFlashPartition = useCallback(async () => {
    const serial = store.activeFastbootSerial
    const partition = store.selectedPartition
    const filePath = store.selectedImagePath

    if (operationInProgressRef.current) return
    if (!serial) {
      toast.error('No fastboot device connected')
      return
    }
    if (!partition) {
      toast.error('Select a partition to flash')
      return
    }
    if (!filePath) {
      toast.error('Select an image file to flash')
      return
    }

    store.setRunningFlash(true)
    store.setError(null)
    try {
      const result = await fastbootSvc.flashPartition(serial, partition, filePath)
      toast.success(result || `Flashed ${partition} successfully`)
      store.setSelectedPartition('')
      store.setSelectedImagePath('')
    } catch (err) {
      const msg = getErrorMessage(err)
      store.setError(msg)
      toast.error(msg)
    } finally {
      store.setRunningFlash(false)
    }
  }, [store.activeFastbootSerial, store.selectedPartition, store.selectedImagePath])

  const executeBatchFlash = useCallback(async () => {
    const serial = store.activeFastbootSerial
    const folderPath = store.romFolderPath
    const plan = store.flashPlan
    const selected = store.selectedPartitions
    const steps = store.flashPlanSteps

    if (operationInProgressRef.current) return
    if (!serial || !plan || selected.length === 0) {
      toast.error('No device or no partitions selected')
      return
    }

    const filteredSteps = steps.filter((s) => selected.includes(s.partition))
    if (filteredSteps.length === 0) {
      toast.error('No partitions to flash')
      return
    }

    store.setRunningBatchFlash(true)
    store.setError(null)

    for (const step of filteredSteps) {
      store.setFlashPlanStepStatus(step.partition, 'pending')
    }

    try {
      const filteredPlan = { steps: plan.steps.filter((s) => selected.includes(s.partition)) }
      await fastbootSvc.flashRomFolder(serial, folderPath, filteredPlan)
      toast.success(`Batch flash completed: ${filteredSteps.length} partition(s)`)
    } catch (err) {
      const msg = getErrorMessage(err)
      // Per-step error state already arrives via the flash_step_status event listener.
      store.setError(msg)
      toast.error(msg)
    } finally {
      store.setRunningBatchFlash(false)
    }
  }, [
    store.activeFastbootSerial,
    store.romFolderPath,
    store.flashPlan,
    store.selectedPartitions,
    store.flashPlanSteps,
  ])

  const executeWipeData = useCallback(async () => {
    const serial = store.activeFastbootSerial
    if (operationInProgressRef.current) return
    if (!serial) {
      toast.error('No fastboot device connected')
      return
    }
    store.setRunningWipe(true)
    try {
      const result = await fastbootSvc.wipeData(serial)
      toast.success(result || 'Device data wiped successfully')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      store.setRunningWipe(false)
    }
  }, [store.activeFastbootSerial])

  const executeSideload = useCallback(async () => {
    const serial = store.activeFastbootSerial
    const zipPath = store.sideloadFilePath
    if (operationInProgressRef.current) return
    if (!serial) {
      toast.error('No device connected')
      return
    }
    if (!zipPath) {
      toast.error('Select a ZIP file to sideload')
      return
    }
    store.setRunningSideload(true)
    try {
      const result = await fastbootSvc.sideloadPackage(serial, zipPath)
      toast.success(result || 'Sideload completed')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      store.setRunningSideload(false)
    }
  }, [store.activeFastbootSerial, store.sideloadFilePath])

  const executeCustomCommand = useCallback(async () => {
    const serial = store.activeFastbootSerial
    const args = store.customCommand.trim()
    if (!serial) {
      toast.error('No fastboot device connected')
      return
    }
    if (!args) {
      toast.error('Enter a fastboot command')
      return
    }
    store.setRunningCommand(true)
    try {
      const output = await fastbootSvc.runCustomFastbootCommand(serial, args)
      store.setCustomCommandOutput(output)
    } catch (err) {
      store.setCustomCommandOutput(getErrorMessage(err))
    } finally {
      store.setRunningCommand(false)
    }
  }, [store.activeFastbootSerial, store.customCommand])

  const resetFlashPlan = useCallback(() => {
    store.setFlashPlan(null)
    store.setRomFolderPath('')
  }, [])

  // WOF (Wake on Fastboot): continue boot out of fastboot without a physical
  // Start/Power press. Falls back to the active serial when none passed.
  const continueBoot = useCallback(async () => {
    const serial = store.activeFastbootSerial
    if (!serial) {
      toast.error('No fastboot device connected')
      return
    }
    try {
      const result = await fastbootSvc.fastbootContinue(serial)
      toast.success(result || `Continuing boot on ${serial}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [store.activeFastbootSerial])

  // WOF: wake the device screen via KEYCODE_WAKEUP (power-button replacement).
  const wakeScreen = useCallback(async () => {
    const serial = store.activeFastbootSerial
    if (!serial) {
      toast.error('No device connected')
      return
    }
    try {
      const result = await fastbootSvc.wakeScreen(serial)
      toast.success(result || `Wake signal sent to ${serial}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [store.activeFastbootSerial])

  // WOF: wake + dismiss non-secure keyguard (one-tap turn-on).
  const wakeAndUnlock = useCallback(async () => {
    const serial = store.activeFastbootSerial
    if (!serial) {
      toast.error('No device connected')
      return
    }
    try {
      const result = await fastbootSvc.wakeAndUnlock(serial)
      toast.success(result || `Wake + unlock sent to ${serial}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [store.activeFastbootSerial])

  // WOF: toggle "Stay awake while charging" so the screen never sleeps on USB.
  const setStayAwake = useCallback(
    async (enabled: boolean) => {
      const serial = store.activeFastbootSerial
      if (!serial) {
        toast.error('No device connected')
        return
      }
      try {
        const result = await fastbootSvc.setStayAwakeWhileCharging(serial, enabled)
        toast.success(result)
      } catch (err) {
        toast.error(getErrorMessage(err))
        throw err
      }
    },
    [store.activeFastbootSerial],
  )

  const getStayAwake = useCallback(async (): Promise<boolean> => {
    const serial = store.activeFastbootSerial
    if (!serial) return false
    try {
      return await fastbootSvc.getStayAwakeWhileCharging(serial)
    } catch {
      return false
    }
  }, [store.activeFastbootSerial])

  return {
    ...store,
    syncFastbootDevices: syncDevices,
    chooseImageFile,
    chooseSideloadFile,
    chooseRomFolder,
    loadActiveSlot,
    applyActiveSlot,
    scanSelectedRomFolder,
    executeFlashPartition,
    executeBatchFlash,
    executeWipeData,
    executeSideload,
    executeCustomCommand,
    resetFlashPlan,
    continueBoot,
    wakeScreen,
    wakeAndUnlock,
    setStayAwake,
    getStayAwake,
  }
}
