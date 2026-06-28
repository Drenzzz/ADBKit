import {
  Folder,
  FileText,
  FileCode,
  FileCode2,
  Image,
  Video,
  Music,
  Archive,
  Link,
  File,
} from 'lucide-react'
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

function FileIcon({ name, type }: { name: string; type: FileEntry['type'] }) {
  if (type === 'directory') {
    return <Folder className="h-4 w-4 text-amber-500 fill-amber-500/10 shrink-0" />
  }
  if (type === 'symlink') {
    return <Link className="h-4 w-4 text-[var(--primary)] shrink-0" />
  }

  const ext = name.toLowerCase().split('.').pop() ?? ''

  // Image files
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext)) {
    return <Image className="h-4 w-4 text-fuchsia-500 fill-fuchsia-500/10 shrink-0" />
  }
  // Video files
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', '3gp'].includes(ext)) {
    return <Video className="h-4 w-4 text-indigo-500 fill-indigo-500/10 shrink-0" />
  }
  // Audio files
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
    return <Music className="h-4 w-4 text-violet-500 fill-violet-500/10 shrink-0" />
  }
  // APK files
  if (ext === 'apk') {
    return <FileCode className="h-4 w-4 text-[var(--success)] fill-[var(--success)]/10 shrink-0" />
  }
  // Document files
  if (['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'csv'].includes(ext)) {
    return <FileText className="h-4 w-4 text-[var(--destructive)] fill-[var(--destructive)]/10 shrink-0" />
  }
  // Archives
  if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz'].includes(ext)) {
    return <Archive className="h-4 w-4 text-yellow-500 fill-yellow-500/10 shrink-0" />
  }
  // Code / configs
  if (
    [
      'xml',
      'json',
      'yaml',
      'yml',
      'sh',
      'py',
      'js',
      'ts',
      'html',
      'css',
      'properties',
      'conf',
      'cfg',
      'ini',
    ].includes(ext)
  ) {
    return <FileCode2 className="h-4 w-4 text-cyan-500 fill-cyan-500/10 shrink-0" />
  }

  return <File className="h-4 w-4 text-muted-foreground/80 shrink-0" />
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
      className="group grid grid-cols-[40px_1fr_96px_128px_144px_40px] items-center border-b border-border/30 transition-colors duration-150 hover:bg-muted/50 h-10 cursor-pointer select-none"
      onDoubleClick={() => {
        if (file.type === 'directory') onOpen(file)
      }}
    >
      <div className="px-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(file.path)}
          disabled={isBusy}
        />
      </div>

      <div className="px-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileIcon name={file.name} type={file.type} />
          <span className="text-xs truncate font-medium text-foreground">{file.name}</span>
        </div>
      </div>

      <div className="px-3 text-right text-xs text-muted-foreground/80 font-mono tabular-nums">
        {file.sizeHuman}
      </div>

      <div className="px-3 text-xs text-muted-foreground/75 font-mono hidden md:block">
        {file.permissions}
      </div>

      <div className="px-3 text-xs text-muted-foreground/75 hidden lg:block">
        {file.modifiedAt}
      </div>

      <div className="px-2" onClick={(e) => e.stopPropagation()}>
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
