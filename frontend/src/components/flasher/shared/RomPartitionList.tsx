import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { ScrollableArea } from '@astryxdesign/core/ScrollableArea'
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
    return <CheckCircle2 className="h-[18px] w-[18px] text-[var(--color-success)] shrink-0" />
  }
  if (status === 'error') {
    return <XCircle className="h-[18px] w-[18px] text-[var(--color-error)] shrink-0" />
  }
  if (status === 'running') {
    return <Loader2 className="h-[18px] w-[18px] text-[var(--color-accent)] animate-spin motion-reduce:animate-none shrink-0" />
  }
  if (status === 'pending') {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] shrink-0">
        <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse motion-reduce:animate-none" />
      </span>
    )
  }
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-background-muted)] shrink-0">
      <span className="h-2 w-2 rounded-full bg-[var(--color-text-secondary)]/40" />
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
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[14px] font-semibold text-[var(--color-text-secondary)]">
          {selectedPartitions.length} of {steps.length} selected
        </span>
        <button
          type="button"
          className="rounded-full px-2 py-1 text-[14px] font-semibold text-[var(--color-accent)] transition-colors hover:opacity-80 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
          onClick={noneSelected ? onSelectAll : onDeselectAll}
          disabled={disabled}
        >
          {noneSelected ? 'Select all' : 'Deselect all'}
        </button>
      </div>

      <div className="min-h-0 flex-1 rounded-2xl border border-border/40 bg-[var(--color-surface-inset)] px-2 py-1">
        <ScrollableArea label="ROM partitions" height="100%">
          <div className="space-y-1 py-1">
            {steps.map((step) => {
              const isSelected = selectedPartitions.includes(step.partition)
              return (
                <div
                  key={step.partition}
                  className={cn(
                    'flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--color-background-card)]/60',
                    disabled && 'pointer-events-none opacity-50',
                    !isSelected && 'opacity-60'
                  )}
                >
                  <CheckboxInput
                    value={isSelected}
                    onChange={() => onToggle(step.partition)}
                    isDisabled={disabled}
                    size="sm"
                    label={step.partition}
                    isLabelHidden
                  />
                  <StatusIndicator status={step.status} />
                  <span className="flex-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
                    {step.partition}
                  </span>
                  <span className="max-w-[180px] truncate font-mono text-[13px] text-[var(--color-text-secondary)]">
                    {step.imageFile.split('/').pop()}
                  </span>
                </div>
              )
            })}
          </div>
        </ScrollableArea>
      </div>

      {steps.length === 0 && (
        <p className="py-6 text-center text-[14px] font-medium text-[var(--color-text-secondary)]">
          No partitions found. Select a ROM folder and scan it.
        </p>
      )}
    </div>
  )
}