import { RefreshCw, Search, Eye, EyeOff, FolderPlus, Upload, FolderUp, Files } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FileSortField, FileSortDirection } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FileActionBarProps {
  searchTerm: string
  showHidden: boolean
  sortField: FileSortField
  sortDirection: FileSortDirection
  refreshing: boolean
  onSearchChange: (term: string) => void
  onToggleHidden: () => void
  onSetSortField: (field: FileSortField) => void
  onSetSortDirection: (dir: FileSortDirection) => void
  onRefresh: () => void
  onNewFolder: () => void
  onPushFile: () => void
  onPushFiles: () => void
  onPushFolder: () => void
}

function sortFieldValue(field: FileSortField, dir: FileSortDirection): string {
  return `${field}-${dir}`
}

export function FileActionBar({
  searchTerm,
  showHidden,
  sortField,
  sortDirection,
  refreshing,
  onSearchChange,
  onToggleHidden,
  onSetSortField,
  onSetSortDirection,
  onRefresh,
  onNewFolder,
  onPushFile,
  onPushFiles,
  onPushFolder,
}: FileActionBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Select
        value={sortFieldValue(sortField, sortDirection)}
        onValueChange={(val) => {
          if (!val) return
          const [field, dir] = val.split('-') as [FileSortField, FileSortDirection]
          onSetSortField(field)
          onSetSortDirection(dir)
        }}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name A → Z</SelectItem>
          <SelectItem value="name-desc">Name Z → A</SelectItem>
          <SelectItem value="size-desc">Largest</SelectItem>
          <SelectItem value="size-asc">Smallest</SelectItem>
          <SelectItem value="date-desc">Newest</SelectItem>
          <SelectItem value="date-asc">Oldest</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onToggleHidden}
        title={showHidden ? 'Hide hidden files' : 'Show hidden files'}
      >
        {showHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNewFolder} title="New folder">
        <FolderPlus className="h-3.5 w-3.5" />
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPushFile} title="Import file">
        <Upload className="h-3.5 w-3.5" />
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPushFiles} title="Import files">
        <Files className="h-3.5 w-3.5" />
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPushFolder} title="Import folder">
        <FolderUp className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onRefresh}
        disabled={refreshing}
        title="Refresh"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
      </Button>
    </div>
  )
}
