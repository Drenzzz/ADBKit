import { RefreshCw, Search, Eye, EyeOff, FolderPlus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  onSort: (field: FileSortField) => void
  onRefresh: () => void
  onNewFolder: () => void
  onPushFile: () => void
}

export function FileActionBar({
  searchTerm,
  showHidden,
  refreshing,
  onSearchChange,
  onToggleHidden,
  onRefresh,
  onNewFolder,
  onPushFile,
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

      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPushFile} title="Push file to device">
        <Upload className="h-3.5 w-3.5" />
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
