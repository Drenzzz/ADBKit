import { useEffect } from 'react'
import {
  getDevices,
  getActiveSerial,
  setActiveSerial as persistActiveSerial,
  getDeviceInfo,
  getDeviceMode,
  getDeviceNicknames,
} from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'

const DEVICE_POLL_INTERVAL = 8000

let syncPromise: Promise<void> | null = null

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to sync devices'
}

async function syncDeviceState(isBackgroundRefresh: boolean) {
  const store = useDeviceStore.getState()

  if (isBackgroundRefresh) {
    store.setRefreshing(true)
  } else {
    store.setLoading(true)
  }

  try {
    const [nextDevices, persistedActiveSerial, persistedNicknames] = await Promise.all([
      getDevices(),
      getActiveSerial(),
      getDeviceNicknames(),
    ])

    store.setDevices(nextDevices)
    store.setNicknames(persistedNicknames)

    let nextActiveSerial = persistedActiveSerial
    const firstDevice = nextDevices[0]

    if (!nextActiveSerial && firstDevice) {
      nextActiveSerial = firstDevice.serial
      await persistActiveSerial(nextActiveSerial)
    }

    const serialExists = nextDevices.some((device) => device.serial === nextActiveSerial)
    if (!serialExists) {
      nextActiveSerial = firstDevice?.serial ?? ''
      if (nextActiveSerial) {
        await persistActiveSerial(nextActiveSerial)
      }
    }

    store.setActiveSerial(nextActiveSerial)

    if (nextActiveSerial) {
      const [nextDeviceInfo, nextDeviceMode] = await Promise.all([
        getDeviceInfo(nextActiveSerial),
        getDeviceMode(nextActiveSerial),
      ])
      store.setDeviceInfo(nextDeviceInfo)
      store.setDeviceMode(nextDeviceMode)
    } else {
      store.setDeviceInfo(null)
      store.setDeviceMode('unknown')
    }

    store.setLastUpdatedAt(Date.now())
    store.setError(null)
  } catch (syncError) {
    store.setError(getErrorMessage(syncError))
  } finally {
    store.setLoading(false)
    store.setRefreshing(false)
  }
}

export function refreshDeviceState(isBackgroundRefresh = true): Promise<void> {
  if (syncPromise) {
    return syncPromise
  }

  syncPromise = syncDeviceState(isBackgroundRefresh).finally(() => {
    syncPromise = null
  })

  return syncPromise
}

export function useDeviceSync() {
  useEffect(() => {
    void refreshDeviceState(false)

    const intervalId = window.setInterval(() => {
      if (document.hidden) return
      void refreshDeviceState(true)
    }, DEVICE_POLL_INTERVAL)

    function handleVisibilityChange() {
      if (!document.hidden) {
        void refreshDeviceState(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
