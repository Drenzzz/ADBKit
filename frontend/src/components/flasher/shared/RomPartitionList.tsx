import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  IconCircleCheck as CheckCircle2,
  IconCircleXFilled as XCircle,
  IconLoader2 as Loader2
} from "@tabler/icons-react"
import type { FlashPlanStepStatus } from '@/lib/types'

interface RomPartitionListProps {
  steps: FlashPlanStepStatus[]
  selectedPartitions: string[]
  onToggle: (partition: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  disabled?: boolean
}

function StatusIndicator({ status }: { status: FlashPlanStepStatus['status'] }) {
  if (status === 'success') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
  }
  if (status === 'error') {
    return <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
  }
  if (status === 'running') {
    return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
  }
  if (status === 'pending') {
    return (
      <span className="h-3 w-3 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      </span>
    )
  }
  // idle
  return (
    <span className="h-3 w-3 rounded-full bg-zinc-150 dark:bg-zinc-800 flex items-center justify-center shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-350 dark:bg-zinc-650" />
    </span>
  )
}

export function RomPartitionList({
  steps,
  selectedPartitions,
  onToggle,
  onSelectAll,
  onDeselectAll,
  disabled,
}: RomPartitionListProps) {
  const noneSelected = selectedPartitions.length === 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1.5">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-500">
          {selectedPartitions.length} of {steps.length} selected
        </span>
        <button
          type="button"
          className="text-[11px] font-semibold text-primary hover:text-primary/95 transition-colors cursor-pointer outline-none disabled:opacity-40"
          onClick={noneSelected ? onSelectAll : onDeselectAll}
          disabled={disabled}
        >
          {noneSelected ? 'Select all' : 'Deselect all'}
        </button>
      </div>

      <ScrollArea className="max-h-[220px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20 px-2.5 py-1">
        <div className="space-y-0.5 py-1">
          {steps.map((step) => {
            const isSelected = selectedPartitions.includes(step.partition)
            return (
              <div
                key={step.partition}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40',
                  disabled && 'pointer-events-none opacity-50',
                  !isSelected && 'opacity-60'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(step.partition)}
                  disabled={disabled}
                  className="rounded"
                />
                <StatusIndicator status={step.status} />
                <span className={cn('flex-1 font-semibold text-zinc-900 dark:text-zinc-100')}>
                  {step.partition}
                </span>
                <span className="truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-650 max-w-[120px]">
                  {step.imageFile.split('/').pop()}
                </span>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {steps.length === 0 && (
        <p className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-medium">
          No partitions found. Select a ROM folder and scan it.
        </p>
      )}
    </div>
  )
}
