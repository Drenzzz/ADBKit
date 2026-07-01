import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { FileRow } from './FileRow'
import { EmptyFolderState, NoSearchResultsState } from './EmptyStates'
import type { FileEntry, FileSortField, FileSortDirection } from '@/lib/types'
import { ArrowUp, ArrowDown } from 'lucide-react'

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
  return (
    <span
      className="inline-flex items-center gap-1 cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
      role="button"
    >
      {label}
      {isActive &&
        (direction === 'asc' ? (
          <ArrowUp className="h-3 w-3 text-primary" />
        ) : (
          <ArrowDown className="h-3 w-3 text-primary" />
        ))}
    </span>
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

  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  const allPaths = files.map((f) => f.path)
  const allSelected =
    allPaths.length > 0 && allPaths.every((p) => selectedFiles.includes(p))

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
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
    <div className="flex-1 min-h-0 flex flex-col relative">
      {/* Table Header */}
      <div className="grid grid-cols-[40px_1fr_96px_128px_144px_40px] items-center border-b border-border bg-muted/20 sticky top-0 z-10 h-10 select-none shrink-0">
        <div className="px-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => onSelectAll(allPaths)}
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
        <div className="px-3 hidden md:block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Permissions
          </span>
        </div>
        <div className="px-3 hidden lg:block">
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

      {/* Table Body */}
      <div ref={parentRef} className="flex-1 overflow-auto perf-scroll">
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
    </div>
  )
}
