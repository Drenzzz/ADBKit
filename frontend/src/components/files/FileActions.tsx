import {
  IconDotsVertical,
  IconFolderOpen,
  IconDownload,
  IconPencil,
  IconTrash,
  IconDeviceUsb,
  IconFolderDown,
  IconFolderUp,
  IconCopy,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { FileEntry } from '@/lib/types'

interface FileActionsProps {
  file: FileEntry
  isBusy: boolean
  onOpen: (file: FileEntry) => void
  onPull: (file: FileEntry) => void
  onPush: (file: FileEntry) => void
  onPushFolder: (file: FileEntry) => void
  onRename: (file: FileEntry) => void
  onMove: (file: FileEntry) => void
  onDelete: (file: FileEntry) => void
  onGetSize: (file: FileEntry) => void
}

const ITEM = 'gap-3.5 px-4 py-2.5 text-[15px] font-medium transition-[background-color,padding] duration-150 ease-out data-highlighted:pl-5'
const ICON = 'size-[18px] stroke-[1.75]'

export function FileActions({
  file,
  isBusy,
  onOpen,
  onPull,
  onPush,
  onPushFolder,
  onRename,
  onMove,
  onDelete,
  onGetSize,
}: FileActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        disabled={isBusy}
        aria-label={`Actions for ${file.name}`}
      >
        <IconDotsVertical size={18} stroke={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl border-border/50 bg-card/95 p-1.5 backdrop-blur-2xl">
        <div className="border-b border-border/40 px-4 pb-2.5 pt-2">
          <p className="truncate text-[14px] font-bold tracking-tight text-[var(--color-text-primary)]">
            {file.name}
          </p>
          <p className="mt-0.5 truncate text-[14px] tabular text-[var(--color-text-secondary)]">
            {file.type === 'directory' ? 'Folder' : `${file.sizeHuman} · ${file.modifiedAt}`}
          </p>
        </div>

        {file.type === 'directory' && (
          <DropdownMenuItem className={ITEM} onClick={() => onOpen(file)}>
            <IconFolderOpen className={ICON} /> Open
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className={ITEM} onClick={() => onPull(file)}>
          <IconDownload className={ICON} /> Export to PC
        </DropdownMenuItem>
        {file.type === 'directory' && (
          <>
            <DropdownMenuItem className={ITEM} onClick={() => onPush(file)}>
              <IconCopy className={ICON} /> Import files here
            </DropdownMenuItem>
            <DropdownMenuItem className={ITEM} onClick={() => onPushFolder(file)}>
              <IconFolderUp className={ICON} /> Import folder here
            </DropdownMenuItem>
            <DropdownMenuItem className={ITEM} onClick={() => onGetSize(file)}>
              <IconDeviceUsb className={ICON} /> Get size
              <span className="ml-auto text-[14px] text-[var(--color-text-secondary)]">du</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem className={ITEM} onClick={() => onMove(file)}>
          <IconFolderDown className={ICON} /> Move to…
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={() => onRename(file)}>
          <IconPencil className={ICON} /> Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          className={cn(ITEM, 'text-[var(--color-error)] focus:text-[var(--color-error)]')}
          onClick={() => onDelete(file)}
        >
          <IconTrash className={ICON} /> Delete
          <span className="ml-auto text-[14px] opacity-70">permanent</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
