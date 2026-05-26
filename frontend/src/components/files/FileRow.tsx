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
    <tr
      className="group border-b border-border/50 transition-colors hover:bg-muted/50"
      onDoubleClick={() => {
        if (file.type === 'directory') onOpen(file)
      }}
    >
      <td className="w-10 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(file.path)}
          disabled={isBusy}
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileIcon type={file.type} />
          <span className="text-sm truncate">{file.name}</span>
        </div>
      </td>
      <td className="w-24 px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">
        {file.sizeHuman}
      </td>
      <td className="w-32 px-3 py-2 text-xs text-muted-foreground hidden md:table-cell">
        {file.permissions}
      </td>
      <td className="w-36 px-3 py-2 text-xs text-muted-foreground hidden lg:table-cell">
        {file.modifiedAt}
      </td>
      <td className="w-10 px-2 py-2">
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
      </td>
    </tr>
  )
}
