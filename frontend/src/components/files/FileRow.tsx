import { Folder, File, Link } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { FileActions } from './FileActions'
import type { FileEntry } from '@/lib/types'

interface FileRowProps {
  file: FileEntry
  isSelected: boolean
  isBusy: boolean
  onSelect: (path: string) => void
  onOpen: (file: FileEntry) => void
  onPull: (file: FileEntry) => void
  onPush: (file: FileEntry) => void
  onPushFolder: (file: FileEntry) => void
  onMove: (file: FileEntry) => void
  onRename: (file: FileEntry) => void
  onDelete: (file: FileEntry) => void
  onGetSize: (file: FileEntry) => void
}

function FileIcon({ type }: { type: FileEntry['type'] }) {
  if (type === 'directory') return <Folder className="h-4 w-4 text-primary" />
  if (type === 'symlink') return <Link className="h-4 w-4 text-muted-foreground" />
  return <File className="h-4 w-4 text-muted-foreground" />
}

export function FileRow({
  file,
  isSelected,
  isBusy,
  onSelect,
  onOpen,
  onPull,
  onPush,
  onPushFolder,
  onMove,
  onRename,
  onDelete,
  onGetSize,
}: FileRowProps) {
  return (
    <div
      className="group grid grid-cols-[40px_1fr_96px_128px_144px_40px] items-center border-b border-border/50 transition-colors hover:bg-muted/50 h-full"
      onDoubleClick={() => {
        if (file.type === 'directory') onOpen(file)
      }}
    >
      <div className="px-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(file.path)}
          disabled={isBusy}
        />
      </div>
      <div className="px-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileIcon type={file.type} />
          <span className="text-sm truncate">{file.name}</span>
        </div>
      </div>
      <div className="px-3 text-right text-xs text-muted-foreground tabular-nums">
        {file.sizeHuman}
      </div>
      <div className="px-3 text-xs text-muted-foreground hidden md:block">
        {file.permissions}
      </div>
      <div className="px-3 text-xs text-muted-foreground hidden lg:block">
        {file.modifiedAt}
      </div>
      <div className="px-2">
        <FileActions
          file={file}
          isBusy={isBusy}
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
    </div>
  )
}
