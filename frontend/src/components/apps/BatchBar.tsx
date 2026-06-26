import { Trash2, Eye, EyeOff, Square, Eraser, Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { PackageBatchAction } from '@/lib/types'

interface BatchBarProps {
  count: number
  busyAction: PackageBatchAction | null
  onUninstall: () => void
  onEnable: () => void
  onDisable: () => void
  onForceStop: () => void
  onClearData: () => void
  onExportApk: () => void
  onClear: () => void
}

export function BatchBar({
  count,
  busyAction,
  onUninstall,
  onEnable,
  onDisable,
  onForceStop,
  onClearData,
  onExportApk,
  onClear,
}: BatchBarProps) {
  const reduced = useReducedMotion()

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 40, x: '-50%', opacity: 0, scale: 0.96 }}
          animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
          exit={{ y: 40, x: '-50%', opacity: 0, scale: 0.96 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-22 left-1/2 z-40 flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-4 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md shrink-0"
        >
          <span className="text-xs font-semibold text-foreground px-2 border-r border-border/40 shrink-0">
            {count} selected
          </span>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEnable}
              disabled={busyAction !== null}
              className="h-8 rounded-full px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Enable
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onDisable}
              disabled={busyAction !== null}
              className="h-8 rounded-full px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <EyeOff className="mr-1.5 h-3.5 w-3.5" />
              Disable
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onForceStop}
              disabled={busyAction !== null}
              className="h-8 rounded-full px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <Square className="mr-1.5 h-3.5 w-3.5" />
              Stop
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearData}
              disabled={busyAction !== null}
              className="h-8 rounded-full px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <Eraser className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onExportApk}
              disabled={busyAction !== null}
              className="h-8 rounded-full px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={onUninstall}
              disabled={busyAction !== null}
              className={cn(
                'h-8 rounded-full px-3 text-[11px] font-semibold transition-all',
                'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20'
              )}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Uninstall
            </Button>
          </div>

          <div className="h-4 w-px bg-border/40 shrink-0" />

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 shrink-0"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
