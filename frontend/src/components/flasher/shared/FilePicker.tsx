import { cn } from '@/lib/utils'
import {
  IconUpload,
  IconFolderOpen,
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
  const Icon = variant === 'folder' ? IconFolderOpen : IconUpload
  const hasValue = value.trim().length > 0

  return (
    <button
      onClick={onBrowse}
      disabled={disabled}
      type="button"
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-colors duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
        hasValue
          ? 'bg-[var(--color-surface-inset)]'
          : 'border-2 border-dashed border-border/50 bg-[var(--color-surface-inset)]/60 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-inset)]',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background-card)] text-[var(--color-text-secondary)]">
        <Icon size={20} stroke={1.75} />
      </div>
      {hasValue ? (
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold text-[var(--color-text-primary)]">{basename(value)}</span>
          <span className="block truncate text-[13px] font-mono text-[var(--color-text-secondary)]">{value}</span>
        </div>
      ) : (
        <span className="text-[16px] font-semibold text-[var(--color-text-secondary)]">{placeholder}</span>
      )}
    </button>
  )
}