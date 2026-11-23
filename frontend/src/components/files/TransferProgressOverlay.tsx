import { Button } from '@astryxdesign/core/Button'
import {
  IconX as X
} from "@tabler/icons-react"

interface TransferProgressOverlayProps {
  fileName: string
  direction: 'push' | 'pull'
  percent: number
  onCancel: () => void
}

export function TransferProgressOverlay({
  fileName,
  direction,
  percent,
  onCancel,
}: TransferProgressOverlayProps) {
  const label = direction === 'pull' ? 'Exporting' : 'Importing'

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[360px] -translate-x-1/2 rounded-lg border border-border/60 bg-background/95 px-4 py-3 shadow-[var(--shadow-floating)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-muted-foreground">{label}</span>
            <span className="truncate text-[14px] font-medium">{fileName}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary-container transition-transform duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-1 text-[14px] text-muted-foreground/60">{percent}%</div>
        </div>
        <Button
          variant="ghost"
          isIconOnly
          size="sm"
          className="h-7 w-7 shrink-0"
          onClick={onCancel}
          tooltip="Cancel transfer"
          label="Cancel transfer"
          icon={<X className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  )
}
