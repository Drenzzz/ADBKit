import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { useAppManagerStore } from '@/stores/useAppManagerStore'

const mocks = vi.hoisted(() => ({
  listPackages: vi.fn(),
  uninstallPackage: vi.fn(),
  uninstallMultiplePackages: vi.fn(),
  enablePackage: vi.fn(),
  enableMultiplePackages: vi.fn(),
  disablePackage: vi.fn(),
  disableMultiplePackages: vi.fn(),
  clearPackageData: vi.fn(),
  pullPackageApk: vi.fn(),
  launchPackage: vi.fn(),
  forceStopPackage: vi.fn(),
  getPackageDetails: vi.fn(),
  selectApkFile: vi.fn(),
}))

vi.mock('@/services/packageService', () => mocks)

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
}))

import { useAppManager } from '../useAppManager'

const pkgA = { packageName: 'com.example.appA', isEnabled: true, isSystemApp: false }
const pkgB = { packageName: 'com.example.appB', isEnabled: true, isSystemApp: false }

describe('uninstallBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDeviceStore.getState().reset()
    useAppManagerStore.getState().reset()
    mocks.listPackages.mockResolvedValue([pkgA, pkgB])
    mocks.uninstallMultiplePackages.mockResolvedValue('Uninstalled 2 packages')
  })

  it('sets busyBatchAction then clears it after success', async () => {
    const { result } = renderHook(() => useAppManager())
    act(() => {
      useAppManagerStore.getState().setSelectedPackages(['com.example.appA', 'com.example.appB'])
    })
    await act(async () => {
      await result.current.uninstallBatch()
    })
    expect(useAppManagerStore.getState().busyBatchAction).toBeNull()
  })

  it('calls uninstallMultiplePackages with selected package names', async () => {
    const { result } = renderHook(() => useAppManager())
    act(() => {
      useAppManagerStore.getState().setSelectedPackages(['com.example.appA', 'com.example.appB'])
    })
    await act(async () => {
      await result.current.uninstallBatch()
    })
    expect(mocks.uninstallMultiplePackages).toHaveBeenCalledOnce()
    expect(mocks.uninstallMultiplePackages).toHaveBeenCalledWith([
      'com.example.appA',
      'com.example.appB',
    ])
  })

  it('clears selection after success', async () => {
    const { result } = renderHook(() => useAppManager())
    act(() => {
      useAppManagerStore.getState().setSelectedPackages(['com.example.appA'])
    })
    await act(async () => {
      await result.current.uninstallBatch()
    })
    expect(useAppManagerStore.getState().selectedPackages).toEqual([])
  })

  it('does nothing when no packages are selected', async () => {
    const { result } = renderHook(() => useAppManager())
    act(() => {
      useAppManagerStore.getState().setSelectedPackages([])
    })
    await act(async () => {
      await result.current.uninstallBatch()
    })
    expect(mocks.uninstallMultiplePackages).not.toHaveBeenCalled()
    expect(useAppManagerStore.getState().busyBatchAction).toBeNull()
  })

  it('clears busyBatchAction on failure', async () => {
    const { result } = renderHook(() => useAppManager())
    act(() => {
      useAppManagerStore.getState().setSelectedPackages(['com.example.appA'])
    })
    mocks.uninstallMultiplePackages.mockRejectedValueOnce(new Error('Uninstall failed'))
    await act(async () => {
      await result.current.uninstallBatch()
    })
    expect(useAppManagerStore.getState().busyBatchAction).toBeNull()
  })
})

describe('uninstallSingle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDeviceStore.getState().reset()
    useAppManagerStore.getState().reset()
    mocks.uninstallPackage.mockResolvedValue('Uninstalled com.example.appA')
  })

  it('clears busyPackageName after uninstall completes', async () => {
    const { result } = renderHook(() => useAppManager())
    await act(async () => {
      await result.current.uninstallSingle('com.example.appA')
    })
    expect(useAppManagerStore.getState().busyPackageName).toBeNull()
  })

  it('calls uninstallPackage with the correct name', async () => {
    const { result } = renderHook(() => useAppManager())
    await act(async () => {
      await result.current.uninstallSingle('com.example.appA')
    })
    expect(mocks.uninstallPackage).toHaveBeenCalledOnce()
    expect(mocks.uninstallPackage).toHaveBeenCalledWith('com.example.appA')
  })
})
