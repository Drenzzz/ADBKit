import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp
} from "@tabler/icons-react"

const COMMON_PARTITIONS = ['boot', 'recovery', 'dtbo', 'vbmeta', 'system', 'vendor']

const ALL_PARTITIONS = [
  'boot',
  'boot_a',
  'boot_b',
  'init_boot',
  'init_boot_a',
  'init_boot_b',
  'vendor_boot',
  'vendor_boot_a',
  'vendor_boot_b',
  'dtbo',
  'vbmeta',
  'vbmeta_system',
  'vbmeta_vendor',
  'recovery',
  'recovery_a',
  'recovery_b',
  'system',
  'system_ext',
  'vendor',
  'product',
  'odm',
  'super',
  'userdata',
]

interface PartitionChipsProps {
  selected: string
  onSelect: (partition: string) => void
  disabled?: boolean
}

export function PartitionChips({ selected, onSelect, disabled }: PartitionChipsProps) {
  const [expanded, setExpanded] = useState(false)
  const partitions = expanded ? ALL_PARTITIONS : COMMON_PARTITIONS

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {partitions.map((p) => {
          const isSelected = selected === p
          return (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(isSelected ? '' : p)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold border transition-colors duration-200 cursor-pointer outline-none select-none",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground shadow-sm scale-[1.03]"
                  : "bg-background dark:bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                disabled && "opacity-40 cursor-not-allowed pointer-events-none"
              )}
            >
              {p}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none",
          disabled && "pointer-events-none"
        )}
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Show common partitions
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            Show all partitions
          </>
        )}
      </button>
    </div>
  )
}
