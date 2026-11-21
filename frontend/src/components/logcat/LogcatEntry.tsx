import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { LogcatEntry as LogcatEntryType } from '@/lib/types'

const LEVEL_COLORS: Record<string, string> = {
  V: 'text-[var(--color-text-secondary)]',
  D: 'text-[var(--logcat-debug)]',
  I: 'text-[var(--logcat-info)]',
  W: 'text-[var(--logcat-warn)]',
  E: 'text-[var(--logcat-error)]',
  F: 'text-[var(--logcat-fatal)] font-bold',
}

const LEVEL_BG: Record<string, string> = {
  V: 'bg-[var(--color-text-secondary)]/10',
  D: 'bg-[var(--logcat-debug)]/10',
  I: 'bg-[var(--logcat-info)]/10',
  W: 'bg-[var(--logcat-warn)]/10',
  E: 'bg-[var(--logcat-error)]/10',
  F: 'bg-[var(--logcat-error)]/20',
}

const ROW_TINT: Record<string, string> = {
  W: 'bg-[var(--logcat-warn)]/5',
  E: 'bg-[var(--logcat-error)]/5',
  F: 'bg-[var(--logcat-error)]/10',
}

interface LogcatEntryProps {
  entry: LogcatEntryType
}

export const LogcatEntry = memo(function LogcatEntry({ entry }: LogcatEntryProps) {
  const levelColor = LEVEL_COLORS[entry.level] ?? LEVEL_COLORS.V
  const levelBg = LEVEL_BG[entry.level] ?? LEVEL_BG.V
  const messageColor =
    entry.level === 'W' || entry.level === 'E' || entry.level === 'F'
      ? levelColor
      : 'text-[var(--color-text-primary)]'

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-1.5 font-sans text-[14px] leading-5 transition-colors hover:bg-[var(--color-background-card)]/40',
        ROW_TINT[entry.level],
      )}
    >
      <span className={cn('grid size-5 shrink-0 place-items-center rounded font-mono text-[13px] font-semibold tabular-nums', levelBg, levelColor)}>
        {entry.level}
      </span>
      <span className="shrink-0 font-mono text-[13px] text-[var(--color-text-secondary)] tabular-nums select-none">
        {entry.time}
      </span>
      <span className="w-20 shrink-0 text-right font-mono text-[13px] text-[var(--color-text-secondary)] tabular-nums select-none">
        {entry.pid}/{entry.tid}
      </span>
      <span className={cn('max-w-[200px] shrink-0 truncate font-semibold', levelColor)}>
        {entry.tag}
      </span>
      <span className={cn('flex-1 truncate', messageColor)}>
        {entry.message}
      </span>
    </div>
  )
})