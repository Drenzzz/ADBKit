import { Search, ArrowUpDown, Files, FolderPlus, LayoutList, Folder, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  onPushFiles: () => void
  onPushFolder: () => void

  // Stats props for alignment
  totalItems: number
  folderCount: number
  fileCount: number
  lastUpdatedAt: number | null
}

const SORT_OPTIONS: { value: FileSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
  { value: 'date', label: 'Date' },
]

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
  onNewFolder,
  onPushFiles,
  onPushFolder,
  totalItems,
  folderCount,
  fileCount,
  lastUpdatedAt,
}: FileActionBarProps) {
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortField)?.label ?? 'Sort'

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Search & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-9 pr-4 text-xs rounded-full border-border/40 bg-muted/50 transition-colors hover:border-border/80 focus:border-primary focus:bg-background"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-3.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-[colors,transform] cursor-pointer shadow-sm active:scale-[0.97]"
          >
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            {currentSortLabel}
            {sortDirection === 'desc' ? ' ↓' : ' ↑'}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-border/60 rounded-xl">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => {
                  if (sortField === opt.value) {
                    onSetSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                  } else {
                    onSetSortField(opt.value)
                    onSetSortDirection('asc')
                  }
                }}
                className={cn(
                  'rounded-lg text-xs',
                  sortField === opt.value && 'font-medium text-primary',
                )}
              >
                {opt.label}
                {sortField === opt.value && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 h-8 px-2.5 rounded-full border border-border/40 bg-muted/50 select-none shadow-sm">
          <Switch
            checked={showHidden}
            onCheckedChange={onToggleHidden}
            className="scale-75"
          />
          <span className="text-[11px] font-semibold text-muted-foreground">Show hidden files</span>
        </div>
      </div>

      {/* Row 2: Action Buttons (Left) & Stats Capsule (Right) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 w-full">
        {/* Left: Labeled Push/Create Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs font-semibold gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-[colors,transform] active:scale-[0.97] shadow-sm border-0 cursor-pointer px-4"
            onClick={onPushFiles}
            disabled={refreshing}
          >
            <Files className="h-3.5 w-3.5 text-primary-foreground" />
            Push Files
          </Button>

          <Button
            size="sm"
            className="h-7 text-xs font-semibold gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-[colors,transform] active:scale-[0.97] shadow-sm border-0 cursor-pointer px-4"
            onClick={onPushFolder}
            disabled={refreshing}
          >
            <FolderPlus className="h-3.5 w-3.5 text-primary-foreground" />
            Push Folder
          </Button>

          <Button
            size="sm"
            className="h-7 text-xs font-semibold gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-[colors,transform] active:scale-[0.97] shadow-sm border-0 cursor-pointer px-4"
            onClick={onNewFolder}
            disabled={refreshing}
          >
            <FolderPlus className="h-3.5 w-3.5 text-primary-foreground" />
            New Folder
          </Button>
        </div>

        {/* Right: Apple-like Stats Capsule */}
        <div className="flex items-center gap-3 px-3.5 py-1 rounded-full border border-border/40 bg-muted/50 text-[11px] text-muted-foreground select-none h-8 shadow-sm">
          <div className="flex items-center gap-1">
            <LayoutList className="h-3 w-3 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">{totalItems}</span>
            <span>items</span>
          </div>
          <span className="text-border/60">·</span>
          <div className="flex items-center gap-1">
            <Folder className="h-3 w-3 text-amber-500 fill-amber-500/10" />
            <span className="font-semibold text-foreground">{folderCount}</span>
            <span>folders</span>
          </div>
          <span className="text-border/60">·</span>
          <div className="flex items-center gap-1">
            <File className="h-3 w-3 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">{fileCount}</span>
            <span>files</span>
          </div>
          {lastUpdatedAt && (
            <>
              <span className="text-border/60">·</span>
              <span className="font-medium">
                Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
