import { useRef } from 'react'
import { motion } from 'motion/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { FileRow } from './FileRow'
import { EmptyFolderState, NoSearchResultsState } from './EmptyStates'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { FileEntry, FileSortField, FileSortDirection } from '@/lib/types'
import {
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react"

const GRID = 'grid grid-cols-[44px_minmax(0,1fr)_110px_120px_150px_48px]'
const ROW_HEIGHT = 64

interface SortHeaderProps {
  label: string
  field: FileSortField
  currentField: FileSortField
  direction: FileSortDirection
  onSort: (field: FileSortField) => void
}

function SortHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
}: SortHeaderProps) {
  const isActive = field === currentField
  const Icon = direction === 'asc' ? IconArrowUp : IconArrowDown
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        'inline-flex items-center gap-1 select-none rounded-md px-1 py-0.5 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
        isActive
          ? 'text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
      )}
    >
      {label}
      {isActive && <Icon size={14} stroke={1.75} className="text-[var(--color-accent)]" />}
    </button>
  )
}

interface FileTableProps {
  files: FileEntry[]
  selectedFiles: string[]
  loading: boolean
  searchTerm: string
  sortField: FileSortField
  sortDirection: FileSortDirection
  busyFilePath: string | null
  onSelect: (path: string) => void
  onSelectAll: (paths: string[]) => void
  onSort: (field: FileSortField) => void
  onOpen: (file: FileEntry) => void
  onPull: (file: FileEntry) => void
  onPush: (file: FileEntry) => void
  onPushFolder: (file: FileEntry) => void
  onMove: (file: FileEntry) => void
  onRename: (file: FileEntry) => void
  onDelete: (file: FileEntry) => void
  onGetSize: (file: FileEntry) => void
}

export function FileTable({
  files,
  selectedFiles,
  loading,
  searchTerm,
  sortField,
  sortDirection,
  busyFilePath,
  onSelect,
  onSelectAll,
  onSort,
  onOpen,
  onPull,
  onPush,
  onPushFolder,
  onMove,
  onRename,
  onDelete,
  onGetSize,
}: FileTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  const allPaths = files.map((f) => f.path)
  const allSelected =
    allPaths.length > 0 && allPaths.every((p) => selectedFiles.includes(p))

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={56} width="100%" radius={4} />
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return searchTerm.trim() ? (
      <NoSearchResultsState term={searchTerm} />
    ) : (
      <EmptyFolderState />
    )
  }
  return (
    <motion.div
      className="relative flex min-h-0 flex-1 flex-col"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div
        className={`${GRID} sticky top-0 z-10 h-11 shrink-0 select-none items-center border-b border-border/40 bg-[var(--color-surface-inset)]`}
      >
        <div className="flex justify-center">
          <CheckboxInput
            value={allSelected}
            onChange={() => onSelectAll(allPaths)}
            size="sm"
            label="Select all files"
            isLabelHidden
          />
        </div>
        <div className="px-3">
          <SortHeader
            label="Name"
            field="name"
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
        </div>
        <div className="px-3 text-right">
          <SortHeader
            label="Size"
            field="size"
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
        </div>
        <div className="hidden px-3 md:block">
          <span className="text-[14px] font-semibold text-[var(--color-text-secondary)]">
            Perm
          </span>
        </div>
        <div className="hidden px-3 lg:block">
          <SortHeader
            label="Modified"
            field="date"
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
        </div>
        <div className="px-2" />
      </div>

      {/* Body (virtualized) */}
      <div ref={parentRef} className="perf-scroll min-h-0 flex-1 overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const file = files[virtualRow.index]
            if (!file) return null

            return (
              <div
                key={file.path}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <FileRow
                  file={file}
                  isSelected={selectedFiles.includes(file.path)}
                  isBusy={busyFilePath === file.path}
                  onSelect={onSelect}
                  onOpen={onOpen}
                  onPull={onPull}
                  onPush={onPush}
                  onPushFolder={onPushFolder}
                  onMove={onMove}
                  onRename={onRename}
                  onDelete={onDelete}
                  onGetSize={onGetSize}
                />
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
