import { useEffect, useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { useFileExplorer } from '@/hooks/useFileExplorer'
import { getStorageInfo } from '@/services/fileService'
import { Breadcrumb } from '@/components/files/Breadcrumb'
import { StorageBar } from '@/components/files/StorageBar'
import { FileActionBar } from '@/components/files/FileActionBar'
import { FileTable } from '@/components/files/FileTable'
import { FileActionDialogs } from '@/components/files/FileActionDialogs'
import { TransferProgressOverlay } from '@/components/files/TransferProgressOverlay'
import { NoDeviceState } from '@/components/files/EmptyStates'
import type { StorageInfo } from '@/lib/types'

export default function FilesPage() {
  const { activeSerial } = useDevices()
  const fe = useFileExplorer()
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)

  useEffect(() => {
    if (!activeSerial) { setStorageInfo(null); return }
    getStorageInfo()
      .then(setStorageInfo)
      .catch(() => setStorageInfo(null))
  }, [activeSerial, fe.lastUpdatedAt])

  if (!activeSerial) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">File Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Browse, push, pull, and manage files on connected devices.
          </p>
        </div>
        <NoDeviceState />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight">File Explorer</h1>
          <div className="mt-1">
            <Breadcrumb items={fe.breadcrumbs} onNavigate={fe.navigateTo} />
          </div>
        </div>
        <div className="w-64 shrink-0">
          <StorageBar info={storageInfo} />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {fe.totalItems} items ({fe.folderCount} folders, {fe.fileCount} files)
        {fe.lastUpdatedAt && (
          <span className="ml-2">
            Updated {new Date(fe.lastUpdatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <FileActionBar
        searchTerm={fe.searchTerm}
        showHidden={fe.showHidden}
        sortField={fe.sortField}
        sortDirection={fe.sortDirection}
        refreshing={fe.refreshing}
        onSearchChange={fe.setSearchTerm}
        onToggleHidden={() => fe.setShowHidden(!fe.showHidden)}
        onSetSortField={(field) => fe.setSort(field)}
        onSetSortDirection={(dir) => fe.setSortDirection(dir)}
        onRefresh={fe.refreshFiles}
        onNewFolder={fe.openNewFolderDialog}
        onPushFile={async () => {
          const path = await fe.chooseLocalFile()
          if (path) {
            const name = path.split(/[/\\]/).pop() ?? path
            await fe.pushSingleFile(path, `${fe.currentPath}/${name}`)
          }
        }}
        onPushFiles={fe.handlePushFilesToCurrentDirectory}
        onPushFolder={fe.openPushFolderDialog}
      />

      {fe.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {fe.error}
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <FileTable
          files={fe.visibleFiles}
          selectedFiles={fe.selectedFiles}
          loading={fe.loading}
          searchTerm={fe.searchTerm}
          sortField={fe.sortField}
          sortDirection={fe.sortDirection}
          busyFilePath={fe.busyFilePath}
          onSelect={fe.toggleFileSelection}
          onSelectAll={fe.toggleVisibleSelection}
          onSort={fe.setSort}
          onOpen={fe.openDirectory}
          onPull={fe.openPullDialog}
          onPush={async (targetDir) => {
            const paths = await fe.chooseMultipleLocalFiles()
            if (paths.length === 0) return
            const remoteDir = `${targetDir.path}`
            const { pushMultipleFiles } = await import('@/services/fileService')
            const { toast } = await import('sonner')
            try {
              await toast.promise(pushMultipleFiles(paths, remoteDir), {
                loading: `Importing ${paths.length} file(s)...`,
                success: (msg) => msg,
                error: (err) => err instanceof Error ? err.message : 'Failed to import files',
              })
              await fe.refreshFiles()
            } catch {
              // toast.promise already surfaces the error to the user
            }
          }}
          onPushFolder={async (targetDir) => {
            const localPath = await fe.chooseLocalDirectory()
            if (localPath) {
              const folderName = localPath.split(/[/\\]/).pop() ?? localPath
              await fe.pushSingleFile(localPath, `${targetDir.path}/${folderName}`)
            }
          }}
          onMove={fe.openMoveDialog}
          onRename={fe.openRenameDialog}
          onDelete={fe.openDeleteDialog}
          onGetSize={fe.getSizeForFile}
        />
      </div>

      {fe.selectedCount > 0 && (
        <div className="fixed bottom-16 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm">
          <span className="text-sm font-medium text-foreground">
            {fe.selectedCount} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            onClick={fe.openBatchPullDialog}
          >
            Export
          </button>
          <button
            className="text-xs text-destructive hover:text-destructive/80 transition-colors px-2 py-1"
            onClick={fe.openBatchDeleteDialog}
          >
            Delete
          </button>
          <div className="h-4 w-px bg-border" />
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            onClick={fe.clearSelection}
          >
            Clear
          </button>
        </div>
      )}

      <FileActionDialogs
        dialogTargetFile={fe.dialogTargetFile}
        selectedCount={fe.selectedCount}
        isPullDialogOpen={fe.isPullDialogOpen}
        isPushDialogOpen={fe.isPushDialogOpen}
        isPushFolderDialogOpen={fe.isPushFolderDialogOpen}
        isRenameDialogOpen={fe.isRenameDialogOpen}
        isDeleteDialogOpen={fe.isDeleteDialogOpen}
        isNewFolderDialogOpen={fe.isNewFolderDialogOpen}
        isMoveDialogOpen={fe.isMoveDialogOpen}
        isBatchPullDialogOpen={fe.isBatchPullDialogOpen}
        isBatchDeleteDialogOpen={fe.isBatchDeleteDialogOpen}
        setIsPullDialogOpen={fe.setIsPullDialogOpen}
        setIsPushDialogOpen={fe.setIsPushDialogOpen}
        setIsPushFolderDialogOpen={fe.setIsPushFolderDialogOpen}
        setIsRenameDialogOpen={fe.setIsRenameDialogOpen}
        setIsDeleteDialogOpen={fe.setIsDeleteDialogOpen}
        setIsNewFolderDialogOpen={fe.setIsNewFolderDialogOpen}
        setIsMoveDialogOpen={fe.setIsMoveDialogOpen}
        setIsBatchPullDialogOpen={fe.setIsBatchPullDialogOpen}
        setIsBatchDeleteDialogOpen={fe.setIsBatchDeleteDialogOpen}
        onPullConfirm={fe.handlePullConfirm}
        onPushConfirm={fe.handlePushConfirm}
        onPushFolderConfirm={fe.handlePushFolderConfirm}
        onRenameConfirm={fe.handleRenameConfirm}
        onDeleteConfirm={fe.handleDeleteConfirm}
        onNewFolderConfirm={fe.handleNewFolderConfirm}
        onMoveConfirm={fe.handleMoveConfirm}
        onBatchPullConfirm={fe.handleBatchPullConfirm}
        onBatchDeleteConfirm={fe.handleBatchDeleteConfirm}
        chooseLocalFile={fe.chooseLocalFile}
        chooseLocalDirectory={fe.chooseLocalDirectory}
      />

      {fe.transferProgress?.active && (
        <TransferProgressOverlay
          fileName={fe.transferProgress.fileName}
          direction={fe.transferProgress.direction}
          percent={fe.transferProgress.percent}
          onCancel={fe.cancelTransfer}
        />
      )}
    </div>
  )
}
