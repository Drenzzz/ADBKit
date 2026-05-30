import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { LogcatEntry as LogcatEntryType } from '@/lib/types'

const LEVEL_COLORS: Record<string, string> = {
  V: 'text-muted-foreground',
  D: 'text-blue-400',
  I: 'text-green-400',
  W: 'text-yellow-400',
  E: 'text-red-400',
  F: 'text-red-400 font-bold',
}

const LEVEL_BG: Record<string, string> = {
  V: 'bg-muted-foreground/10',
  D: 'bg-blue-400/10',
  I: 'bg-green-400/10',
  W: 'bg-yellow-400/10',
  E: 'bg-red-400/10',
  F: 'bg-red-400/20',
}

interface LogcatEntryProps {
  entry: LogcatEntryType
}

export const LogcatEntry = memo(function LogcatEntry({ entry }: LogcatEntryProps) {
  const levelColor = LEVEL_COLORS[entry.level] ?? LEVEL_COLORS.V
  const levelBg = LEVEL_BG[entry.level] ?? LEVEL_BG.V

  return (
    <div className="flex items-start gap-2 px-3 py-1 font-mono text-[11px] leading-relaxed hover:bg-muted/30 transition-colors">
      <span className={cn('shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold tabular-nums', levelBg, levelColor)}>
        {entry.level}
      </span>
      <span className="shrink-0 text-muted-foreground tabular-nums select-none">
        {entry.time}
      </span>
      <span className="shrink-0 text-muted-foreground tabular-nums w-16 text-right select-none">
        {entry.pid}/{entry.tid}
      </span>
      <span className="shrink-0 text-cyan-400/80 truncate max-w-[180px]">
        {entry.tag}
      </span>
      <span className={cn('flex-1 truncate', levelColor)}>
        {entry.message}
      </span>
    </div>
  )
})
