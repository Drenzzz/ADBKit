import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  className?: string
}

function SortHeader({ label, field, currentField, direction, onSort, className }: SortHeaderProps) {
  const isActive = field === currentField
  return (
    <TableHead className={className} onClick={() => onSort(field)} role="button">
      <span className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors">
        {label}
        {isActive && (
          direction === 'asc'
            ? <ArrowUp className="h-3 w-3" />
            : <ArrowDown className="h-3 w-3" />
        )}
      </span>
    </TableHead>
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
  onMove,
  onRename,
  onDelete,
  onGetSize,
}: FileTableProps) {
  const allPaths = files.map((f) => f.path)
  const allSelected = allPaths.length > 0 && allPaths.every((p) => selectedFiles.includes(p))

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
    return searchTerm.trim()
      ? <NoSearchResultsState term={searchTerm} />
      : <EmptyFolderState />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 px-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => onSelectAll(allPaths)}
            />
          </TableHead>
          <SortHeader label="Name" field="name" currentField={sortField} direction={sortDirection} onSort={onSort} className="px-3" />
          <SortHeader label="Size" field="size" currentField={sortField} direction={sortDirection} onSort={onSort} className="w-24 px-3 text-right" />
          <TableHead className="w-32 px-3 hidden md:table-cell">Permissions</TableHead>
          <SortHeader label="Modified" field="date" currentField={sortField} direction={sortDirection} onSort={onSort} className="w-36 px-3 hidden lg:table-cell" />
          <TableHead className="w-10 px-2" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <FileRow
            key={file.path}
            file={file}
            isSelected={selectedFiles.includes(file.path)}
            isBusy={busyFilePath === file.path}
            onSelect={onSelect}
            onOpen={onOpen}
            onPull={onPull}
            onPush={onPush}
            onMove={onMove}
            onRename={onRename}
            onDelete={onDelete}
            onGetSize={onGetSize}
          />
        ))}
      </TableBody>
    </Table>
  )
}
