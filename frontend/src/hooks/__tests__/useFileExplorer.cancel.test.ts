import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { useFileExplorerStore } from '@/stores/useFileExplorerStore'
import { useFileExplorer } from '../useFileExplorer'

const mocks = vi.hoisted(() => ({
  listFiles: vi.fn().mockResolvedValue([]),
  getDirectorySize: vi.fn().mockResolvedValue('0 B'),
  pullFile: vi.fn().mockResolvedValue('OK'),
  pullMultipleFiles: vi.fn().mockResolvedValue('OK'),
  pushFile: vi.fn().mockResolvedValue('OK'),
  pushMultipleFiles: vi.fn().mockResolvedValue('OK'),
  deleteMultipleFiles: vi.fn().mockResolvedValue('OK'),
  createDirectory: vi.fn().mockResolvedValue('OK'),
  renameFile: vi.fn().mockResolvedValue('OK'),
  selectFile: vi.fn().mockResolvedValue(''),
  selectMultipleFiles: vi.fn().mockResolvedValue([]),
  selectDirectory: vi.fn().mockResolvedValue(''),
  onFileTransferProgress: vi.fn(() => () => {}),
  cancelFileTransfer: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
  },
}))

vi.mock('@/services/fileService', () => mocks)
vi.mock('sonner', () => ({ toast: mocks.toast }))

describe('useFileExplorer transfer cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDeviceStore.getState().reset()
    useFileExplorerStore.getState().reset()
  })

  it('reports a cancelled batch push without a success toast', async () => {
    mocks.pushMultipleFiles.mockRejectedValueOnce(new Error('push_file: Push canceled by user'))
    const { result } = renderHook(() => useFileExplorer())

    let completed: boolean | undefined
    await act(async () => {
      completed = await result.current.pushMultipleToCurrentDir(['C:\\temp\\file.bin'])
    })

    expect(completed).toBe(false)
    expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('Push batch cancelled'))
    expect(toast.success).not.toHaveBeenCalled()
    expect(result.current.transferProgress).toBeNull()
    expect(result.current.busyBatchAction).toBeNull()
  })

  it('keeps transfer progress visible until the cancelled operation settles', () => {
    const { result } = renderHook(() => useFileExplorer())

    act(() => {
      useFileExplorerStore.getState().setTransferProgress({
        fileName: 'file.bin',
        direction: 'push',
        percent: 42,
        active: true,
      })
      result.current.cancelTransfer()
    })

    expect(mocks.cancelFileTransfer).toHaveBeenCalledOnce()
    expect(result.current.transferProgress).toMatchObject({ fileName: 'file.bin', percent: 42, active: true })
  })
})
