import { Badge } from '@/components/ui/badge'

const LABEL: Record<string, string> = {
  config: 'Config',
  'system-path': 'System PATH',
  'app-data': 'Managed',
  'common-path': 'Discovered',
}

const VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  config: 'default',
  'system-path': 'secondary',
  'app-data': 'outline',
  'common-path': 'outline',
}

interface BinarySourceBadgeProps {
  source?: string
}

export function BinarySourceBadge({ source }: BinarySourceBadgeProps) {
  if (!source) return null
  const label = LABEL[source] ?? source
  const variant = VARIANT[source] ?? 'outline'
  return (
    <Badge variant={variant} className="text-[10px]">
      {label}
    </Badge>
  )
}
