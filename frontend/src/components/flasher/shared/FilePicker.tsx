import { cn } from '@/lib/utils'
import { Upload, FolderOpen } from 'lucide-react'
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
        'flex w-full items-center gap-3 px-3 py-2 text-left rounded-xl border transition-all duration-200 outline-none select-none cursor-pointer',
        hasValue
          ? 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
          : 'bg-zinc-50/20 dark:bg-zinc-950/10 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-600" />
      {hasValue ? (
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">{basename(value)}</span>
          <span className="block truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-500">{value}</span>
        </div>
      ) : (
        <span className="text-xs font-medium">{placeholder}</span>
      )}
    </button>
  )
}
