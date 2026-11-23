const LABEL: Record<string, string> = {
  config: 'Config',
  'system-path': 'System PATH',
  'app-data': 'Managed',
  'common-path': 'Discovered',
}

interface BinarySourceBadgeProps {
  source?: string
}

export function BinarySourceBadge({ source }: BinarySourceBadgeProps) {
  if (!source) return null
  return (
    <span className="text-[14px] text-[var(--color-text-secondary)]">
      {LABEL[source] ?? source}
    </span>
  )
}