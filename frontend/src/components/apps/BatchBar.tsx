import { Trash2, Eye, EyeOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PackageBatchAction } from '@/lib/types'

interface BatchBarProps {
  count: number
  busyAction: PackageBatchAction | null
  onUninstall: () => void
  onEnable: () => void
  onDisable: () => void
  onClear: () => void
}

export function BatchBar({
  count,
  busyAction,
  onUninstall,
  onEnable,
  onDisable,
  onClear,
}: BatchBarProps) {
  if (count === 0) return null

  return (
    <div className="fixed bottom-16 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm">
      <span className="text-sm font-medium text-foreground">
        {count} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <Button
        size="sm"
        variant="ghost"
        onClick={onEnable}
        disabled={busyAction !== null}
      >
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Enable
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={onDisable}
        disabled={busyAction !== null}
      >
        <EyeOff className="mr-1.5 h-3.5 w-3.5" />
        Disable
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={onUninstall}
        disabled={busyAction !== null}
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Uninstall
      </Button>

      <div className="h-4 w-px bg-border" />

      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
