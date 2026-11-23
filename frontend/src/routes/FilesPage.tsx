import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  IconDownload as Download,
  IconPencil as Pencil,
  IconRefresh,
  IconTrash as Trash2,
  IconX as X
} from "@tabler/icons-react"
import { useDevices } from '@/hooks/useDevices'
import { useFileExplorer } from '@/hooks/useFileExplorer'
import { useFileExplorerStore } from '@/stores/useFileExplorerStore'
import { getStorageInfo, pushMultipleFiles, unblockPath } from '@/services/fileService'
import { toast } from '@/lib/toast'
import { Breadcrumb } from '@/components/files/Breadcrumb'
import { StorageBar } from '@/components/files/StorageBar'
import { FileActionBar } from '@/components/files/FileActionBar'
import { FileTable } from '@/components/files/FileTable'
import { FileActionDialogs } from '@/components/files/FileActionDialogs'
import { TransferProgressOverlay } from '@/components/files/TransferProgressOverlay'
import { NoDeviceState } from '@/components/files/EmptyStates'
import { UnblockPathDialog } from '@/components/files/UnblockPathDialog'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import type { StorageInfo, UnblockResult } from '@/lib/types'


function PageHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <Heading level={1} type="display-1" weight="semibold" maxLines={1}>Files</Heading>
        <Text type="body" color="secondary">Browse, push, pull, and manage files on connected devices</Text>
      </div>
    </div>
  )
}

export default function FilesPage() {
  const reduced = useReducedMotion()
  const { activeSerial, refreshDevices, refreshing: devicesRefreshing } = useDevices()
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
      <div className="dashboard-scale flex h-full min-h-0 flex-col gap-4 p-5">
        <PageHeader />
        <div className="min-h-0 flex-1">
          <NoDeviceState onRefresh={refreshDevices} refreshing={devicesRefreshing} />
        </div>
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
        : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="dashboard-scale js flex h-full min-h-0 flex-col gap-4 p-5 font-sans"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Heading level={1} type="display-1" weight="semibold" maxLines={1}>Files</Heading>
          <Text type="body" color="secondary">Browse, push, pull, and manage files on connected devices</Text>
        </div>
      </motion.div>

      {/* Breadcrumb + storage card */}
      <motion.div
        variants={itemVariants}
        className="m3-surface flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-3.5"
      >
        <Breadcrumb items={fe.breadcrumbs} onNavigate={fe.navigateTo} />
        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label="Refresh devices and files"
            onClick={() => { refreshDevices(); fe.refreshFiles() }}
            disabled={devicesRefreshing || fe.refreshing}
            title="Re-check ADB device and refresh files"
            className="flex size-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
          >
            <IconRefresh
              size={18}
              stroke={1.75}
              className={(devicesRefreshing || fe.refreshing) ? 'animate-spin motion-reduce:animate-none' : undefined}
            />
          </button>
          <div className="h-6 w-px bg-border/40" aria-hidden="true" />
          <div className="w-72">
            <StorageBar info={storageInfo} />
          </div>
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

      {/* Skip the device-level error here: an empty card below already covers it. */}
      {fe.error && !fe.error.toLowerCase().includes('device') && (
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[14px] text-destructive"
        >
          {fe.error}
        </motion.div>
      )}

      {/* Floating selection dock */}
      <AnimatePresence>
        {fe.selectedCount > 0 && (
          <motion.div
            key="selection-dock"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 56 }}
            transition={reduced ? { duration: 0.12 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="pointer-events-none fixed inset-x-0 bottom-10 z-40 flex justify-center px-6"
          >
            <div className="pointer-events-auto flex items-center gap-3 rounded-3xl border border-border/40 bg-card/85 py-3 pl-7 pr-3 backdrop-blur-2xl">
              <span className="shrink-0 text-[16px] font-bold tabular text-[var(--color-text-primary)]">
                {fe.selectedCount} selected
              </span>

              <div className="h-6 w-px shrink-0 bg-border/50" />

              <button
                type="button"
                onClick={fe.openBatchPullDialog}
                className="flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                <Download size={18} stroke={1.75} />
                Export
              </button>

              {fe.selectedCount === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const selected = fe.visibleFiles.find((f) =>
                      fe.selectedFiles.includes(f.path),
                    )
                    if (selected) fe.openRenameDialog(selected)
                  }}
                  className="flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                >
                  <Pencil size={18} stroke={1.75} />
                  Rename
                </button>
              )}

              <button
                type="button"
                onClick={fe.openBatchDeleteDialog}
                className="flex h-11 items-center gap-2 rounded-full bg-[var(--color-error)] px-6 text-[15px] font-bold text-white transition-[background-color,transform] duration-150 hover:bg-[color-mix(in_srgb,var(--color-error)_90%,black)] active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--color-error)] motion-reduce:transition-none motion-reduce:duration-0"
              >
                <Trash2 size={18} stroke={1.75} />
                Delete
              </button>

              <button
                type="button"
                aria-label="Clear selection"
                onClick={fe.clearSelection}
                className="ml-1 flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                <X size={18} stroke={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List Card */}
      <motion.div
        variants={itemVariants}
        className="m3-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl"
      >
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
                loading: `Importing ${paths.length} file(s)…`,
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
        isRenameDialogOpen={fe.isRenameDialogOpen}
        isDeleteDialogOpen={fe.isDeleteDialogOpen}
        isNewFolderDialogOpen={fe.isNewFolderDialogOpen}
        isMoveDialogOpen={fe.isMoveDialogOpen}
        isBatchPullDialogOpen={fe.isBatchPullDialogOpen}
        isBatchDeleteDialogOpen={fe.isBatchDeleteDialogOpen}
        setIsPullDialogOpen={fe.setIsPullDialogOpen}
        setIsPushDialogOpen={fe.setIsPushDialogOpen}
        setIsRenameDialogOpen={fe.setIsRenameDialogOpen}
        setIsDeleteDialogOpen={fe.setIsDeleteDialogOpen}
        setIsNewFolderDialogOpen={fe.setIsNewFolderDialogOpen}
        setIsMoveDialogOpen={fe.setIsMoveDialogOpen}
        setIsBatchPullDialogOpen={fe.setIsBatchPullDialogOpen}
        setIsBatchDeleteDialogOpen={fe.setIsBatchDeleteDialogOpen}
        onPullConfirm={fe.handlePullConfirm}
        onPushConfirm={fe.handlePushConfirm}
        onRenameConfirm={fe.handleRenameConfirm}
        onDeleteConfirm={fe.handleDeleteConfirm}
        onNewFolderConfirm={fe.handleNewFolderConfirm}
        onMoveConfirm={fe.handleMoveConfirm}
        onBatchPullConfirm={fe.handleBatchPullConfirm}
        onBatchDeleteConfirm={fe.handleBatchDeleteConfirm}
        chooseLocalFile={fe.chooseLocalFile}
        chooseLocalSaveFile={fe.chooseLocalSaveFile}
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
