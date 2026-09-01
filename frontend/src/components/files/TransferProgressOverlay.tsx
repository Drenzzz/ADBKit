import { Button } from '@/components/ui/button'
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
    <div className="fixed bottom-20 left-1/2 z-50 w-[360px] -translate-x-1/2 rounded-lg border border-border/60 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="truncate text-xs font-medium">{fileName}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground/60">{percent}%</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onCancel}
          title="Cancel transfer"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
