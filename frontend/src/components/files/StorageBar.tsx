import type { StorageInfo } from '@/lib/types'

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIdx = 0
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024
    unitIdx++
  }
  return `${value.toFixed(unitIdx === 0 ? 0 : 1)} ${units[unitIdx]}`
}

interface StorageBarProps {
  info: StorageInfo | null
}

export function StorageBar({ info }: StorageBarProps) {
  if (!info) return null

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-colors duration-300"
          style={{ width: `${Math.min(info.usedPct, 100)}%` }}
        />
      </div>
      <span className="shrink-0 tabular-nums">
        {formatBytes(info.usedBytes)} / {formatBytes(info.totalBytes)}
        <span className="ml-1 text-muted-foreground/70">({info.usedPct}%)</span>
      </span>
    </div>
  )
}
