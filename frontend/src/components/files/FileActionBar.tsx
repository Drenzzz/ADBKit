import {
  IconSearch,
  IconCopy,
  IconFolderPlus,
} from "@tabler/icons-react"
import { Switch } from '@astryxdesign/core/Switch'
import { Selector } from '@astryxdesign/core/Selector'
import { Button } from '@astryxdesign/core/Button'
import type { FileSortField, FileSortDirection } from '@/lib/types'
import { SdCardPicker } from './SdCardPicker'

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
  onSdCardSelect: (mountPoint: string) => void

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

const DIRECTION_LABEL: Record<FileSortDirection, string> = {
  asc: 'Ascending',
  desc: 'Descending',
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
  onNewFolder,
  onPushFiles,
  onPushFolder,
  onSdCardSelect,
  totalItems,
  folderCount,
  fileCount,
  lastUpdatedAt,
}: FileActionBarProps) {
  return (
    <div className="m3-surface flex flex-col gap-3 rounded-3xl px-4 py-3">
      {/* Row 1: search + sort + direction + hidden toggle + SD */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <IconSearch
            size={18}
            stroke={1.75}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
          />
          <input
            type="search"
            placeholder="Search files…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search files"
            className="h-11 w-full rounded-full bg-[color-mix(in_srgb,var(--color-background-muted)_88%,black)] pl-10 pr-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:bg-[color-mix(in_srgb,var(--color-background-muted)_70%,black)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          />
        </div>

        <Selector
          label="Sort by"
          isLabelHidden
          value={sortField}
          onChange={(v) => onSetSortField(v as FileSortField)}
          options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <Selector
          label="Direction"
          isLabelHidden
          value={sortDirection}
          onChange={(v) => onSetSortDirection(v as FileSortDirection)}
          options={(Object.keys(DIRECTION_LABEL) as FileSortDirection[]).map((d) => ({
            value: d,
            label: DIRECTION_LABEL[d],
          }))}
        />

        <div className="flex h-11 items-center rounded-full bg-[var(--color-background-muted)] px-4">
          <Switch
            label="Hidden"
            labelPosition="start"
            value={showHidden}
            onChange={onToggleHidden}
          />
        </div>

        <SdCardPicker onSelect={onSdCardSelect} disabled={refreshing} />
      </div>

      {/* Row 2: push actions + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            label="Import Files"
            icon={<IconCopy size={18} stroke={1.75} />}
            variant="secondary"
            isDisabled={refreshing}
            onClick={onPushFiles}
          />
          <Button
            label="Import Folders"
            icon={<IconFolderPlus size={18} stroke={1.75} />}
            variant="secondary"
            isDisabled={refreshing}
            onClick={onPushFolder}
          />
          <Button
            label="New Folder"
            icon={<IconFolderPlus size={18} stroke={1.75} />}
            variant="secondary"
            isDisabled={refreshing}
            onClick={onNewFolder}
          />
        </div>

        <div className="flex items-center gap-3 px-1 text-[14px] text-[var(--color-text-secondary)]">
          <span><b className="font-semibold tabular text-[var(--color-text-primary)]">{totalItems}</b> items</span>
          <span className="mx-1 h-4 w-px bg-border/40" aria-hidden="true" />
          <span><b className="font-semibold tabular text-[var(--color-text-primary)]">{folderCount}</b> folders</span>
          <span className="mx-1 h-4 w-px bg-border/40" aria-hidden="true" />
          <span><b className="font-semibold tabular text-[var(--color-text-primary)]">{fileCount}</b> files</span>
          {lastUpdatedAt && (
            <>
              <span className="mx-1 h-4 w-px bg-border/40" aria-hidden="true" />
              <span className="tabular">Updated {new Date(lastUpdatedAt).toLocaleTimeString()}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
