import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {partitions.map((p) => (
          <Badge
            key={p}
            variant={selected === p ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer text-xs transition-colors',
              disabled && 'pointer-events-none opacity-50',
            )}
            onClick={() => onSelect(selected === p ? '' : p)}
          >
            {p}
          </Badge>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground"
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
      >
        {expanded ? (
          <>
            <ChevronUp className="mr-1 h-3 w-3" />
            Show common
          </>
        ) : (
          <>
            <ChevronDown className="mr-1 h-3 w-3" />
            Show all partitions
          </>
        )}
      </Button>
    </div>
  )
}
