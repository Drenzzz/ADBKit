import {
  setActiveSerial as persistActiveSerial,
  getDeviceInfo,
  getDeviceMode,
} from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { refreshDeviceState } from '@/hooks/useDeviceSync'

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
    setActiveSerial,
    setDeviceInfo,
    setDeviceMode,
    setNickname,
    setRefreshing,
    setError,
  } = useDeviceStore()

  async function refreshDevices() {
    await refreshDeviceState(true)
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
