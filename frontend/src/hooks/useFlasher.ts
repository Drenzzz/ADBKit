import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import * as fastbootSvc from '@/services/fastbootService'
import * as deviceSvc from '@/services/deviceService'
import { useFlasherStore } from '@/stores/useFlasherStore'
import type { FlashPlanStepStatus, FlasherMode } from '@/lib/types'

const POLL_INTERVAL = 4000

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred'
}

function findFailedStepPartition(steps: FlashPlanStepStatus[]): string | null {
  for (const step of steps) {
    if (step.status === 'error') return step.partition
  }
  return null
}

export function useFlasher() {
  const store = useFlasherStore()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slotLoadedRef = useRef<string>('')

  const syncDevices = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        store.setRefreshingDevices(true)
      } else {
        store.setLoadingDevices(true)
      }

      try {
        // Poll both fastboot and ADB devices in parallel
        const [fbDevices, adbDevices] = await Promise.allSettled([
          fastbootSvc.getFastbootDevices(),
          deviceSvc.getDevices(),
        ])

        const fastbootList = fbDevices.status === 'fulfilled' ? fbDevices.value : []
        const adbList = adbDevices.status === 'fulfilled' ? adbDevices.value : []

        store.setFastbootDevices(fastbootList)

        // Determine active device and mode
        const currentSerial = store.activeFastbootSerial

        // Check for fastboot device first
        if (fastbootList.length > 0) {
          const stillConnected = currentSerial && fastbootList.some((d) => d.serial === currentSerial)
          if (!stillConnected) {
            store.setActiveFastbootSerial(fastbootList[0].serial)
          }
          const mode: FlasherMode = store.isUserspace ? 'fastbootd' : 'fastboot'
          store.setDeviceMode(mode)
        } else if (adbList.length > 0) {
          // Check for sideload device in ADB list
          const sideloadDevice = adbList.find((d) => d.state === 'sideload')
          if (sideloadDevice) {
            store.setActiveFastbootSerial(sideloadDevice.serial)
            store.setDeviceMode('sideload')
          } else {
            // ADB device present but not in sideload — not relevant for flasher
            store.setDeviceMode(null)
            // Keep current serial if it was a sideload device
          }
        } else {
          // No devices at all
          store.setDeviceMode(null)
          store.setActiveFastbootSerial('')
        }

        store.setLastUpdatedAt(Date.now())
        store.setError(null)
      } catch (err) {
        store.setError(getErrorMessage(err))
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

  // Load slot and userspace status when a fastboot device is connected
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

      for (const step of filteredSteps) {
        store.setFlashPlanStepStatus(step.partition, 'success', 'Flashed successfully')
      }
      toast.success(`Batch flash completed: ${filteredSteps.length} partition(s)`)
    } catch (err) {
      const msg = getErrorMessage(err)
      const failedPartition = findFailedStepPartition(filteredSteps)
      if (failedPartition) {
        store.setFlashPlanStepStatus(failedPartition, 'error', msg)
      }
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
  }
}
