import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle } from 'lucide-react'
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
    return <CheckCircle className="h-3.5 w-3.5 text-green-500" />
  }
  if (status === 'error') {
    return <XCircle className="h-3.5 w-3.5 text-red-500" />
  }
  return null
}

export function RomPartitionList({
  steps,
  selectedPartitions,
  onToggle,
  onSelectAll,
  onDeselectAll,
  disabled,
}: RomPartitionListProps) {
  const allSelected = steps.length > 0 && selectedPartitions.length === steps.length
  const noneSelected = selectedPartitions.length === 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selectedPartitions.length} of {steps.length} selected
        </span>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={noneSelected ? onSelectAll : onDeselectAll}
          disabled={disabled}
        >
          {noneSelected ? 'Select all' : 'Deselect all'}
        </button>
      </div>

      <ScrollArea className="max-h-[200px]">
        <div className="space-y-1">
          {steps.map((step) => {
            const isSelected = selectedPartitions.includes(step.partition)
            return (
              <label
                key={step.partition}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/50',
                  disabled && 'pointer-events-none opacity-50',
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(step.partition)}
                  disabled={disabled}
                />
                <StatusIndicator status={step.status} />
                <span className={cn('flex-1', !isSelected && 'text-muted-foreground line-through')}>
                  {step.partition}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {step.imageFile.split('/').pop()}
                </span>
              </label>
            )
          })}
        </div>
      </ScrollArea>

      {steps.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No partitions found. Select a ROM folder and scan it.
        </p>
      )}
    </div>
  )
}
