import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FileActionDialogs } from '../FileActionDialogs'
import type { FileEntry } from '@/lib/types'

const targetFile: FileEntry = {
  name: 'file.bin',
  path: '/sdcard/file.bin',
  type: 'file',
  size: 12,
  sizeHuman: '12 B',
  permissions: '-rw-rw----',
  modifiedAt: '2026-01-01 00:00',
  isHidden: false,
}

function createProps() {
  return {
    dialogTargetFile: targetFile,
    selectedCount: 0,
    isPullDialogOpen: true,
    isPushDialogOpen: false,
    isPushFolderDialogOpen: false,
    isRenameDialogOpen: false,
    isDeleteDialogOpen: false,
    isNewFolderDialogOpen: false,
    isMoveDialogOpen: false,
    isBatchPullDialogOpen: false,
    isBatchDeleteDialogOpen: false,
    setIsPullDialogOpen: vi.fn(),
    setIsPushDialogOpen: vi.fn(),
    setIsPushFolderDialogOpen: vi.fn(),
    setIsRenameDialogOpen: vi.fn(),
    setIsDeleteDialogOpen: vi.fn(),
    setIsNewFolderDialogOpen: vi.fn(),
    setIsMoveDialogOpen: vi.fn(),
    setIsBatchPullDialogOpen: vi.fn(),
    setIsBatchDeleteDialogOpen: vi.fn(),
    onPullConfirm: vi.fn().mockResolvedValue(undefined),
    onPushConfirm: vi.fn(),
    onPushFolderConfirm: vi.fn(),
    onRenameConfirm: vi.fn(),
    onDeleteConfirm: vi.fn(),
    onNewFolderConfirm: vi.fn(),
    onMoveConfirm: vi.fn(),
    onBatchPullConfirm: vi.fn(),
    onBatchDeleteConfirm: vi.fn(),
    chooseLocalFile: vi.fn().mockResolvedValue('/tmp/source.bin'),
    chooseLocalSaveFile: vi.fn().mockResolvedValue('/tmp/file.bin'),
    chooseLocalDirectory: vi.fn().mockResolvedValue('/tmp'),
  }
}

describe('FileActionDialogs', () => {
  it('uses the save picker with the remote filename for export', async () => {
    const props = createProps()
    render(<FileActionDialogs {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose Location' }))

    await waitFor(() => {
      expect(props.chooseLocalSaveFile).toHaveBeenCalledWith('file.bin')
      expect(props.onPullConfirm).toHaveBeenCalledWith('/tmp/file.bin')
    })
    expect(props.chooseLocalFile).not.toHaveBeenCalled()
  })
})
