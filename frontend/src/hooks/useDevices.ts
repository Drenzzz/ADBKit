import { useEffect, useRef } from 'react'
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to sync devices'
}

export function useDevices() {
  const {
    devices,
    activeSerial,
    deviceInfo,
    deviceMode,
    nicknames,
    loading,
    refreshing,
    error,
    lastUpdatedAt,
    setDevices,
    setActiveSerial,
    setDeviceInfo,
    setDeviceMode,
    setNicknames,
    setNickname,
    setLoading,
    setRefreshing,
    setError,
    setLastUpdatedAt,
  } = useDeviceStore()

  const syncInFlightRef = useRef(false)

  useEffect(() => {
    let active = true

    async function syncDeviceState(isBackgroundRefresh: boolean) {
      if (!active || syncInFlightRef.current) return
      syncInFlightRef.current = true

      if (isBackgroundRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const [nextDevices, persistedActiveSerial, persistedNicknames] = await Promise.all([
          getDevices(),
          getActiveSerial(),
          getDeviceNicknames(),
        ])

        if (!active) return

        setDevices(nextDevices)
        setNicknames(persistedNicknames)

        let nextActiveSerial = persistedActiveSerial
        const firstDevice = nextDevices[0]

        if (!nextActiveSerial && firstDevice) {
          nextActiveSerial = firstDevice.serial
          await persistActiveSerial(nextActiveSerial)
        }

        const serialExists = nextDevices.some((d) => d.serial === nextActiveSerial)
        if (!serialExists) {
          nextActiveSerial = firstDevice?.serial ?? ''
          if (nextActiveSerial) {
            await persistActiveSerial(nextActiveSerial)
          }
        }

        setActiveSerial(nextActiveSerial)

        if (nextActiveSerial) {
          const [nextDeviceInfo, nextDeviceMode] = await Promise.all([
            getDeviceInfo(nextActiveSerial),
            getDeviceMode(nextActiveSerial),
          ])
          if (!active) return
          setDeviceInfo(nextDeviceInfo)
          setDeviceMode(nextDeviceMode)
        } else {
          setDeviceInfo(null)
          setDeviceMode('unknown')
        }

        setLastUpdatedAt(Date.now())
        setError(null)
      } catch (syncError) {
        if (!active) return
        setError(getErrorMessage(syncError))
      } finally {
        syncInFlightRef.current = false
        if (active) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    syncDeviceState(false)

    const intervalId = window.setInterval(() => {
      if (document.hidden) return
      void syncDeviceState(true)
    }, DEVICE_POLL_INTERVAL)

    function handleVisibilityChange() {
      if (document.hidden) return
      void syncDeviceState(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [
    setDevices,
    setActiveSerial,
    setDeviceInfo,
    setDeviceMode,
    setNicknames,
    setLoading,
    setRefreshing,
    setError,
    setLastUpdatedAt,
  ])

  async function refreshDevices() {
    setRefreshing(true)
    try {
      const nextDevices = await getDevices()
      setDevices(nextDevices)
      setLastUpdatedAt(Date.now())
      setError(null)
    } catch (refreshError) {
      setError(getErrorMessage(refreshError))
    } finally {
      setRefreshing(false)
    }
  }

  async function selectDevice(serial: string) {
    setRefreshing(true)
    try {
      await persistActiveSerial(serial)
      const [nextDeviceInfo, nextDeviceMode] = await Promise.all([
        getDeviceInfo(serial),
        getDeviceMode(serial),
      ])
      setActiveSerial(serial)
      setDeviceInfo(nextDeviceInfo)
      setDeviceMode(nextDeviceMode)
      setError(null)
    } catch (selectionError) {
      setError(getErrorMessage(selectionError))
    } finally {
      setRefreshing(false)
    }
  }

  return {
    devices,
    activeSerial,
    deviceInfo,
    deviceMode,
    nicknames,
    loading,
    refreshing,
    error,
    lastUpdatedAt,
    setNickname,
    refreshDevices,
    selectDevice,
  }
}
