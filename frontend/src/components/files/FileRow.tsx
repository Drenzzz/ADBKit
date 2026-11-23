import {
  IconFolder,
  IconFileText,
  IconFileCode,
  IconPhoto,
  IconVideo,
  IconMusic,
  IconArchive,
  IconLink,
  IconFile,
} from "@tabler/icons-react"
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { FileActions } from './FileActions'
import type { FileEntry } from '@/lib/types'

const GRID = 'grid grid-cols-[44px_minmax(0,1fr)_110px_120px_150px_48px]'

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

function FileIcon({ name, type }: { name: string; type: FileEntry['type'] }) {
  if (type === 'directory') {
    return <IconFolder size={20} stroke={1.75} className="shrink-0 text-amber-500 fill-amber-500/10" />
  }
  if (type === 'symlink') {
    return <IconLink size={20} stroke={1.75} className="shrink-0 text-[var(--color-accent)]" />
  }

  const ext = name.toLowerCase().split('.').pop() ?? ''

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext)) {
    return <IconPhoto size={20} stroke={1.75} className="shrink-0 text-fuchsia-500 fill-fuchsia-500/10" />
  }
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', '3gp'].includes(ext)) {
    return <IconVideo size={20} stroke={1.75} className="shrink-0 text-indigo-500 fill-indigo-500/10" />
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
    return <IconMusic size={20} stroke={1.75} className="shrink-0 text-violet-500 fill-violet-500/10" />
  }
  if (ext === 'apk') {
    return <IconFileCode size={20} stroke={1.75} className="shrink-0 text-[var(--color-success)] fill-[color-mix(in_srgb,var(--color-success)_10%,transparent)]" />
  }
  if (['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'csv'].includes(ext)) {
    return <IconFileText size={20} stroke={1.75} className="shrink-0 text-[var(--color-error)] fill-[color-mix(in_srgb,var(--color-error)_10%,transparent)]" />
  }
  if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz'].includes(ext)) {
    return <IconArchive size={20} stroke={1.75} className="shrink-0 text-[var(--color-warning)] fill-[color-mix(in_srgb,var(--color-warning)_10%,transparent)]" />
  }
  if (
    [
      'xml', 'json', 'yaml', 'yml', 'sh', 'py', 'js', 'ts',
      'html', 'css', 'properties', 'conf', 'cfg', 'ini',
    ].includes(ext)
  ) {
    return <IconFileCode size={20} stroke={1.75} className="shrink-0 text-cyan-500 fill-cyan-500/10" />
  }

  return <IconFile size={20} stroke={1.75} className="shrink-0 text-[var(--color-text-secondary)]" />
}

// Short permission form: keep type bit + 3 primary bits, drop the rest.
function shortPermissions(perms: string): string {
  if (perms.length < 4) return perms
  return perms.slice(0, 4)
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
      className={`${GRID} group h-16 cursor-pointer select-none items-center transition-colors duration-150 ${
        isSelected
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]'
          : 'hover:bg-[var(--color-background-muted)]'
      } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
      onDoubleClick={() => {
        if (file.type === 'directory') onOpen(file)
      }}
    >
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <CheckboxInput
          value={isSelected}
          onChange={() => onSelect(file.path)}
          isDisabled={isBusy}
          size="sm"
          label={`Select ${file.name}`}
          isLabelHidden
        />
      </div>

      <div className="min-w-0 pr-3">
        <div className="flex min-w-0 items-center gap-3">
          <FileIcon name={file.name} type={file.type} />
          <p className="truncate text-[15px] font-semibold leading-tight text-[var(--color-text-primary)]">
            {file.name}
          </p>
        </div>
      </div>

      <div className="px-3 text-right text-[14px] tabular text-[var(--color-text-secondary)]">
        {file.sizeHuman}
      </div>

      <div className="hidden px-3 text-[14px] tabular text-[var(--color-text-secondary)] md:block">
        {shortPermissions(file.permissions)}
      </div>

      <div className="hidden px-3 text-[14px] text-[var(--color-text-secondary)] lg:block">
        {file.modifiedAt}
      </div>

      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
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
