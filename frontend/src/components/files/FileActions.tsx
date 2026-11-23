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
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@astryxdesign/core/DropdownMenu'
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

const ITEM = 'px-4 py-2.5 text-[15px] font-medium'
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
    <DropdownMenu
      placement="below"
      alignment="end"
      menuWidth={256}
      renderTrigger={(props) => (
        <button
          {...props}
          type="button"
          disabled={isBusy}
          aria-label={`Actions for ${file.name}`}
          className="flex size-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          <IconDotsVertical size={18} stroke={1.75} />
        </button>
      )}
      header={
        <div className="border-b border-border/40 px-4 pb-2.5 pt-2">
          <p className="truncate text-[14px] font-bold tracking-tight text-[var(--color-text-primary)]">
            {file.name}
          </p>
          <p className="mt-0.5 truncate text-[14px] tabular text-[var(--color-text-secondary)]">
            {file.type === 'directory' ? 'Folder' : `${file.sizeHuman} · ${file.modifiedAt}`}
          </p>
        </div>
      }
    >
      {file.type === 'directory' && (
        <DropdownMenuItem className={ITEM} icon={<IconFolderOpen className={ICON} />} label="Open" onClick={() => onOpen(file)} />
      )}
      <DropdownMenuItem className={ITEM} icon={<IconDownload className={ICON} />} label="Export to PC" onClick={() => onPull(file)} />
      {file.type === 'directory' && (
        <>
          <DropdownMenuItem className={ITEM} icon={<IconCopy className={ICON} />} label="Import files here" onClick={() => onPush(file)} />
          <DropdownMenuItem className={ITEM} icon={<IconFolderUp className={ICON} />} label="Import folder here" onClick={() => onPushFolder(file)} />
          <DropdownMenuItem
            className={ITEM}
            icon={<IconDeviceUsb className={ICON} />}
            label={
              <span className="flex w-full items-center gap-2">
                Get size
                <span className="ml-auto text-[14px] text-[var(--color-text-secondary)]">du</span>
              </span>
            }
            onClick={() => onGetSize(file)}
          />
        </>
      )}
      <DropdownMenuDivider className="my-1.5" />
      <DropdownMenuItem className={ITEM} icon={<IconFolderDown className={ICON} />} label="Move to…" onClick={() => onMove(file)} />
      <DropdownMenuItem className={ITEM} icon={<IconPencil className={ICON} />} label="Rename" onClick={() => onRename(file)} />
      <DropdownMenuDivider className="my-1.5" />
      <DropdownMenuItem
        className={ITEM}
        variant="destructive"
        icon={<IconTrash className={ICON} />}
        label={
          <span className="flex w-full items-center gap-2">
            Delete
            <span className="ml-auto text-[14px] opacity-70">permanent</span>
          </span>
        }
        onClick={() => onDelete(file)}
      />
    </DropdownMenu>
  )
}