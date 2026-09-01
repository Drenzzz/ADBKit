import { cn } from '@/lib/utils'
import {
  IconUpload as Upload,
  IconFolderOpen as FolderOpen
} from "@tabler/icons-react"
import { basename } from '@/lib/utils'

interface FilePickerProps {
  value: string
  placeholder?: string
  variant?: 'file' | 'file-image' | 'folder'
  onBrowse: () => void
  disabled?: boolean
  className?: string
}

export function FilePicker({
  value,
  placeholder = 'Select file...',
  variant = 'file',
  onBrowse,
  disabled,
  className,
}: FilePickerProps) {
  const Icon = variant === 'folder' ? FolderOpen : Upload
  const hasValue = value.trim().length > 0

  return (
    <button
      onClick={onBrowse}
      disabled={disabled}
      type="button"
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2 text-left rounded-xl border transition-colors duration-200 outline-none select-none cursor-pointer',
        hasValue
          ? 'bg-[var(--muted)]/50 dark:bg-[var(--muted)]/30 border-[var(--border)] dark:border-[var(--border)] text-foreground dark:text-foreground shadow-sm'
          : 'bg-[var(--muted)]/20 dark:bg-[var(--muted)]/10 border-dashed border-[var(--border)] dark:border-[var(--border)] text-muted-foreground dark:text-muted-foreground hover:border-[var(--muted-foreground)] dark:hover:border-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 dark:hover:bg-[var(--muted)]/20',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground dark:text-muted-foreground" />
      {hasValue ? (
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">{basename(value)}</span>
          <span className="block truncate font-mono text-[10px] text-muted-foreground dark:text-muted-foreground">{value}</span>
        </div>
      ) : (
        <span className="text-xs font-medium">{placeholder}</span>
      )}
    </button>
  )
}
