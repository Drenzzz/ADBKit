import { Button } from '@/components/ui/button'
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
    <Button
      variant="outline"
      className={cn(
        'h-auto w-full justify-start gap-2 px-3 py-2 text-left',
        hasValue ? 'border-border' : 'border-dashed',
        className,
      )}
      onClick={onBrowse}
      disabled={disabled}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      {hasValue ? (
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{basename(value)}</span>
          <span className="block truncate font-mono text-xs text-muted-foreground">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{placeholder}</span>
      )}
    </Button>
  )
}
