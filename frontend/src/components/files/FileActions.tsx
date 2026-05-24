import {
  MoreHorizontal,
  FolderOpen,
  Download,
  Upload,
  Pencil,
  Trash2,
  HardDrive,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FileEntry } from '@/lib/types'

interface FileActionsProps {
  file: FileEntry
  isBusy: boolean
  onOpen: (file: FileEntry) => void
  onPull: (file: FileEntry) => void
  onPush: (file: FileEntry) => void
  onRename: (file: FileEntry) => void
  onDelete: (file: FileEntry) => void
  onGetSize: (file: FileEntry) => void
}

export function FileActions({
  file,
  isBusy,
  onOpen,
  onPull,
  onPush,
  onRename,
  onDelete,
  onGetSize,
}: FileActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={isBusy}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {file.type === 'directory' && (
          <DropdownMenuItem onClick={() => onOpen(file)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onPull(file)}>
          <Download className="mr-2 h-4 w-4" />
          Pull to PC
        </DropdownMenuItem>
        {file.type === 'directory' && (
          <DropdownMenuItem onClick={() => onPush(file)}>
            <Upload className="mr-2 h-4 w-4" />
            Push to here
          </DropdownMenuItem>
        )}
        {file.type === 'directory' && (
          <DropdownMenuItem onClick={() => onGetSize(file)}>
            <HardDrive className="mr-2 h-4 w-4" />
            Get size
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onRename(file)}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(file)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
