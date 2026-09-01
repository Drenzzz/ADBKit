import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeviceSummary } from '@/lib/types'
import { useDeviceStore } from '@/stores/useDeviceStore'

const serviceMocks = vi.hoisted(() => ({
  getDevices: vi.fn(),
  getActiveSerial: vi.fn(),
  setActiveSerial: vi.fn(),
  getDeviceInfo: vi.fn(),
  getDeviceMode: vi.fn(),
  getDeviceNicknames: vi.fn(),
}))

vi.mock('@/services/deviceService', () => serviceMocks)

import { refreshDeviceState } from '../useDeviceSync'

const device: DeviceSummary = {
  serial: 'ABC123',
  state: 'device',
  mode: 'adb',
}

describe('useDeviceSync', () => {
  beforeEach(() => {
    useDeviceStore.getState().reset()
    vi.clearAllMocks()
    serviceMocks.getDevices.mockResolvedValue([device])
    serviceMocks.getActiveSerial.mockResolvedValue(device.serial)
    serviceMocks.getDeviceNicknames.mockResolvedValue({})
    serviceMocks.getDeviceInfo.mockResolvedValue({ ...device, model: 'Pixel 7' })
    serviceMocks.getDeviceMode.mockResolvedValue('adb')
    serviceMocks.setActiveSerial.mockResolvedValue(undefined)
  })

  it('coalesces concurrent refreshes and updates device state once', async () => {
    let resolveDevices!: (devices: DeviceSummary[]) => void
    serviceMocks.getDevices.mockReturnValueOnce(new Promise((resolve) => {
      resolveDevices = resolve
    }))

    const firstRefresh = refreshDeviceState(false)
    const secondRefresh = refreshDeviceState(true)

    expect(secondRefresh).toBe(firstRefresh)
    resolveDevices([device])
    await firstRefresh

    expect(serviceMocks.getDevices).toHaveBeenCalledTimes(1)
    expect(useDeviceStore.getState().activeSerial).toBe(device.serial)
    expect(useDeviceStore.getState().deviceInfo?.model).toBe('Pixel 7')
    expect(useDeviceStore.getState().loading).toBe(false)
    expect(useDeviceStore.getState().refreshing).toBe(false)
  })

  it('clears loading state and records sync errors', async () => {
    serviceMocks.getDevices.mockRejectedValueOnce(new Error('ADB unavailable'))

    await refreshDeviceState(false)

    expect(useDeviceStore.getState().error).toBe('ADB unavailable')
    expect(useDeviceStore.getState().loading).toBe(false)
    expect(useDeviceStore.getState().refreshing).toBe(false)
  })
})
