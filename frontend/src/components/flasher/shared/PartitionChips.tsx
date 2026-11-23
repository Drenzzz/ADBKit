import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  IconChevronDown,
  IconChevronUp,
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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {partitions.map((p) => {
          const isSelected = selected === p
          return (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(isSelected ? '' : p)}
              className={cn(
                'rounded-full px-4 py-2.5 text-[16px] font-semibold transition-[background-color,color,transform] duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
                isSelected
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-inset)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-text-primary)]',
                disabled && 'pointer-events-none opacity-40',
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
          'inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[14px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40',
          disabled && 'pointer-events-none',
        )}
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
      >
        {expanded ? <IconChevronUp size={16} stroke={1.75} /> : <IconChevronDown size={16} stroke={1.75} />}
        {expanded ? 'Show common partitions' : 'Show all partitions'}
      </button>
    </div>
  )
}