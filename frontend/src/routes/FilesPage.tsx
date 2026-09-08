import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  IconDownload as Download,
  IconPencil as Pencil,
  IconTrash as Trash2,
  IconX as X
} from "@tabler/icons-react"
import { useDevices } from '@/hooks/useDevices'
import { useFileExplorer } from '@/hooks/useFileExplorer'
import { useFileExplorerStore } from '@/stores/useFileExplorerStore'
import { getStorageInfo, pushMultipleFiles, unblockPath } from '@/services/fileService'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/files/Breadcrumb'
import { StorageBar } from '@/components/files/StorageBar'
import { FileActionBar } from '@/components/files/FileActionBar'
import { FileTable } from '@/components/files/FileTable'
import { FileActionDialogs } from '@/components/files/FileActionDialogs'
import { TransferProgressOverlay } from '@/components/files/TransferProgressOverlay'
import { NoDeviceState, EmptyFolderState } from '@/components/files/EmptyStates'
import { UnblockPathDialog } from '@/components/files/UnblockPathDialog'
import { UnmountedSdCardState } from '@/components/files/EmptyStates'
import { Button } from '@/components/ui/button'
import type { StorageInfo, UnblockResult } from '@/lib/types'

function isSdCardMountPath(path: string): boolean {
  return /^\/storage\/[a-f0-9]{4,}-[a-f0-9]{4,}(\/|$)/i.test(path) ||
    /^\/mnt\/media_rw\/[a-f0-9]{4,}-[a-f0-9]{4,}(\/|$)/i.test(path)
}

export default function FilesPage() {
  const reduced = useReducedMotion()
  const { activeSerial } = useDevices()
  const fe = useFileExplorer()
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [unblockResult, setUnblockResult] = useState<UnblockResult | null>(null)
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false)

  useEffect(() => {
    if (!activeSerial) {
      setStorageInfo(null)
      return
    }
    getStorageInfo()
      .then(setStorageInfo)
      .catch(() => setStorageInfo(null))
  }, [activeSerial, fe.lastUpdatedAt])

  // When the file explorer surfaces an error that looks like a protected-path
  // failure, call unblockPath to get honest recovery guidance.
  useEffect(() => {
    if (!fe.error) return
    const lower = fe.error.toLowerCase()
    const isProtected =
      lower.includes('protected') ||
      lower.includes('permission') ||
      lower.includes('access denied') ||
      lower.includes('scoped storage')
    if (!isProtected) return
    const pathMatch = fe.error.match(/\/[^\s]+/)
    const path = pathMatch ? pathMatch[0] : fe.currentPath
    unblockPath(path)
      .then(setUnblockResult)
      .catch(() => setUnblockResult(null))
      .finally(() => {
        if (isProtected) setIsUnblockDialogOpen(true)
      })
  }, [fe.error])

  if (!activeSerial) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">File Explorer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse, push, pull, and manage files on connected devices.
          </p>
        </div>
        <NoDeviceState />
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduced
        ? { duration: 0, staggerChildren: 0 }
        : { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex-1 min-h-0 flex flex-col gap-4 font-sans"
    >
      {/* Header Panel */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between gap-4"
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">File Explorer</h1>
          <div className="mt-1.5">
            <Breadcrumb items={fe.breadcrumbs} onNavigate={fe.navigateTo} />
          </div>
        </div>
        <div className="w-64 shrink-0">
          <StorageBar info={storageInfo} />
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={itemVariants}>
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
          onPushFiles={fe.handlePushFilesToCurrentDirectory}
          onPushFolder={fe.openPushFolderDialog}
          onSdCardSelect={(mountPoint) => {
            fe.navigateTo(mountPoint)
          }}
          totalItems={fe.totalItems}
          folderCount={fe.folderCount}
          fileCount={fe.fileCount}
          lastUpdatedAt={fe.lastUpdatedAt}
        />
      </motion.div>

      {fe.error && (
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {fe.error}
        </motion.div>
      )}

      {/* Dynamic Selection Context Bar (Only shown on selection) */}
      <motion.div variants={itemVariants} className="relative empty:h-0 min-h-0">
        <AnimatePresence mode="wait">
          {fe.selectedCount > 0 && (
            <motion.div
              key="selection-bar"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 h-9 text-xs shadow-sm mb-1"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary tabular-nums">
                  {fe.selectedCount} selected
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-semibold gap-1.5 px-2.5 rounded-full border-primary/20 hover:bg-primary/10 text-primary active:scale-95 cursor-pointer"
                  onClick={fe.openBatchPullDialog}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
                {fe.selectedCount === 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] font-semibold gap-1.5 px-2.5 rounded-full active:scale-95 cursor-pointer"
                    onClick={() => {
                      const selected = fe.visibleFiles.find((f) =>
                        fe.selectedFiles.includes(f.path),
                      )
                      if (selected) fe.openRenameDialog(selected)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-semibold gap-1.5 px-2.5 rounded-full text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 active:scale-95 cursor-pointer"
                  onClick={fe.openBatchDeleteDialog}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <div className="h-4 w-px bg-border" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={fe.clearSelection}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* File List Wrapper */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-border/50 bg-card flex-1 min-h-0 flex flex-col"
      >
        {fe.files.length === 0 && !fe.loading && isSdCardMountPath(fe.currentPath) && (
          <UnmountedSdCardState
            mountPoint={fe.currentPath}
            onRetry={fe.refreshFiles}
          />
        )}
        {fe.files.length === 0 && !fe.loading && !isSdCardMountPath(fe.currentPath) && (
          <EmptyFolderState />
        )}
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
            try {
              await toast.promise(pushMultipleFiles(paths, remoteDir), {
                loading: `Importing ${paths.length} file(s)...`,
                success: (msg) => msg,
                error: (err) =>
                  err instanceof Error ? err.message : 'Failed to import files',
              })
              await fe.refreshFiles()
            } catch {
              // error is already surfaced by toast.promise
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
      </motion.div>

      {/* Action Dialogs */}
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

      {/* Transfer Progress Overlay */}
      {fe.transferProgress?.active && (
        <TransferProgressOverlay
          fileName={fe.transferProgress.fileName}
          direction={fe.transferProgress.direction}
          percent={fe.transferProgress.percent}
          onCancel={fe.cancelTransfer}
        />
      )}

      {/* Protected-path unblock guidance dialog */}
      <UnblockPathDialog
        result={unblockResult}
        open={isUnblockDialogOpen}
        onOpenChange={(open) => {
          setIsUnblockDialogOpen(open)
          if (!open) {
            setUnblockResult(null)
            useFileExplorerStore.getState().setError(null)
          }
        }}
        onRetry={() => {
          setIsUnblockDialogOpen(false)
          setUnblockResult(null)
          useFileExplorerStore.getState().setError(null)
          fe.refreshFiles()
        }}
      />
    </motion.div>
  )
}
