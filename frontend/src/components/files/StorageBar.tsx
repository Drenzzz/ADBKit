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
    <div className="flex min-w-[220px] flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-semibold tabular text-[var(--color-text-primary)]">
          {formatBytes(info.usedBytes)}<span className="text-[var(--color-text-secondary)]"> / {formatBytes(info.totalBytes)}</span>
        </span>
        <span className="text-[14px] font-semibold tabular text-[var(--color-text-secondary)]">
          {info.usedPct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-background-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:duration-0"
          style={{ width: `${Math.min(info.usedPct, 100)}%` }}
        />
      </div>
    </div>
  )
}
