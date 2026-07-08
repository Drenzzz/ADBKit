import { describe, it, expect, beforeEach } from 'vitest'
import { useDeviceStore } from '../useDeviceStore'
import type { DeviceSummary } from '@/lib/types'

describe('useDeviceStore', () => {
  beforeEach(() => {
    useDeviceStore.getState().reset()
  })

  it('starts with empty devices', () => {
    const { devices, activeSerial } = useDeviceStore.getState()
    expect(devices).toEqual([])
    expect(activeSerial).toBe('')
  })

  it('sets devices', () => {
    const mockDevices: DeviceSummary[] = [
      { serial: 'ABC123', state: 'device', mode: 'adb', model: 'Pixel 7' },
      { serial: 'DEF456', state: 'fastboot', mode: 'fastboot' },
    ]
    useDeviceStore.getState().setDevices(mockDevices)
    expect(useDeviceStore.getState().devices).toHaveLength(2)
    expect(useDeviceStore.getState().devices[0].serial).toBe('ABC123')
  })

  it('sets and clears active serial', () => {
    useDeviceStore.getState().setActiveSerial('ABC123')
    expect(useDeviceStore.getState().activeSerial).toBe('ABC123')

    useDeviceStore.getState().setActiveSerial('')
    expect(useDeviceStore.getState().activeSerial).toBe('')
  })

  it('sets nickname', () => {
    useDeviceStore.getState().setNickname('ABC123', 'My Phone')
    expect(useDeviceStore.getState().getNickname('ABC123')).toBe('My Phone')
  })

  it('trims whitespace from nickname', () => {
    useDeviceStore.getState().setNickname('ABC123', '  My Phone  ')
    expect(useDeviceStore.getState().getNickname('ABC123')).toBe('My Phone')
  })

  it('deletes nickname when empty string', () => {
    useDeviceStore.getState().setNickname('ABC123', 'My Phone')
    useDeviceStore.getState().setNickname('ABC123', '')
    expect(useDeviceStore.getState().getNickname('ABC123')).toBe('')
  })

  it('ignores nickname set with empty serial', () => {
    useDeviceStore.getState().setNickname('', 'Should Not Set')
    expect(useDeviceStore.getState().nicknames).toEqual({})
  })

  it('returns empty string for unknown device nickname', () => {
    expect(useDeviceStore.getState().getNickname('UNKNOWN')).toBe('')
  })

  it('sets and clears error', () => {
    useDeviceStore.getState().setError('something failed')
    expect(useDeviceStore.getState().error).toBe('something failed')

    useDeviceStore.getState().setError(null)
    expect(useDeviceStore.getState().error).toBeNull()
  })

  it('sets loading states', () => {
    useDeviceStore.getState().setLoading(true)
    expect(useDeviceStore.getState().loading).toBe(true)

    useDeviceStore.getState().setRefreshing(true)
    expect(useDeviceStore.getState().refreshing).toBe(true)

    useDeviceStore.getState().setInfoLoading(true)
    expect(useDeviceStore.getState().infoLoading).toBe(true)

    useDeviceStore.getState().setPerfLoading(true)
    expect(useDeviceStore.getState().perfLoading).toBe(true)
  })

  it('resets to initial state', () => {
    useDeviceStore.getState().setDevices([{ serial: 'X', state: 'device', mode: 'adb' }])
    useDeviceStore.getState().setActiveSerial('X')
    useDeviceStore.getState().setError('error')
    useDeviceStore.getState().setLoading(true)

    useDeviceStore.getState().reset()

    const state = useDeviceStore.getState()
    expect(state.devices).toEqual([])
    expect(state.activeSerial).toBe('')
    expect(state.error).toBeNull()
    expect(state.loading).toBe(false)
  })
})
