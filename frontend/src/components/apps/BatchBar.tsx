import { AnimatePresence, motion } from 'motion/react'
import {
  IconTrash,
  IconEye,
  IconEyeOff,
  IconSquare,
  IconDownload,
  IconEraser,
  IconX,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { PackageBatchAction } from '@/lib/types'

interface BatchBarProps {
  count: number
  busyAction: PackageBatchAction | null
  onEnable: () => void
  onDisable: () => void
  onForceStop: () => void
  onClearData: () => void
  onExportApk: () => void
  onUninstall: () => void
  onClear: () => void
}

const ACTIONS: Array<{
  busyKey: PackageBatchAction
  icon: typeof IconEye
  label: string
  run: 'onEnable' | 'onDisable' | 'onForceStop' | 'onClearData' | 'onExportApk'
}> = [
  { busyKey: 'enable', icon: IconEye, label: 'Enable', run: 'onEnable' },
  { busyKey: 'disable', icon: IconEyeOff, label: 'Disable', run: 'onDisable' },
  { busyKey: 'force-stop', icon: IconSquare, label: 'Stop', run: 'onForceStop' },
  { busyKey: 'clear-data', icon: IconEraser, label: 'Clear', run: 'onClearData' },
  { busyKey: 'pull-apk', icon: IconDownload, label: 'Export', run: 'onExportApk' },
]

export function BatchBar({
  count,
  busyAction,
  onEnable,
  onDisable,
  onForceStop,
  onClearData,
  onExportApk,
  onUninstall,
  onClear,
}: BatchBarProps) {
  const reduced = useReducedMotion()
  const busy = busyAction !== null

  const handlers = { onEnable, onDisable, onForceStop, onClearData, onExportApk }

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 56 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 56 }}
          transition={reduced ? { duration: 0.12 } : { type: 'spring', stiffness: 420, damping: 32 }}
          className="pointer-events-none fixed inset-x-0 bottom-10 z-40 flex justify-center px-6"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-3xl border border-border/40 bg-card/85 py-3 pl-7 pr-3 backdrop-blur-2xl">
            <span className="shrink-0 text-m font-bold tracking-tight text-[var(--color-text-primary)]">
              {count} selected
            </span>

            <div className="h-6 w-px shrink-0 bg-border/50" />

            <div className="flex items-center gap-0.5">
              {ACTIONS.map(({ busyKey, icon: Icon, label, run }) => (
                <Button
                  key={busyKey}
                  size="lg"
                  variant="ghost"
                  disabled={busy}
                  onClick={handlers[run]}
                  className="h-11 gap-2 rounded-full px-4 text-[18px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <Icon size={18} stroke={1.75} />
                  {label}
                </Button>
              ))}
            </div>

            <div className="h-6 w-px shrink-0 bg-border/50" />

            <Button
              size="sm"
              disabled={busy}
              onClick={onUninstall}
              className="h-10 gap-2 rounded-full bg-[var(--color-error)] px-6 text-[14px] font-bold text-white hover:bg-[color-mix(in_srgb,var(--color-error)_90%,black)] active:scale-95"
            >
              <IconTrash size={18} stroke={1.75} />
              Uninstall
            </Button>

            <button
              type="button"
              aria-label="Clear selection"
              onClick={onClear}
              disabled={busy}
              className={cn(
                'ml-1 flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)]',
                busy && 'pointer-events-none opacity-40',
              )}
            >
              <IconX size={17} stroke={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
