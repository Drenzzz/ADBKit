import type { LogcatLevel } from '@/lib/types'
import { useLogcatStore } from '@/stores/useLogcatStore'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const LEVELS: { value: LogcatLevel; label: string }[] = [
  { value: 'V', label: 'Verbose' },
  { value: 'D', label: 'Debug' },
  { value: 'I', label: 'Info' },
  { value: 'W', label: 'Warn' },
  { value: 'E', label: 'Error' },
  { value: 'F', label: 'Fatal' },
]

const LEVEL_BADGE_COLORS: Record<LogcatLevel, string> = {
  V: 'border-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/10',
  D: 'border-[var(--logcat-debug)]/30 text-[var(--logcat-debug)] hover:bg-[var(--logcat-debug)]/10',
  I: 'border-[var(--logcat-info)]/30 text-[var(--logcat-info)] hover:bg-[var(--logcat-info)]/10',
  W: 'border-[var(--logcat-warn)]/30 text-[var(--logcat-warn)] hover:bg-[var(--logcat-warn)]/10',
  E: 'border-[var(--logcat-error)]/30 text-[var(--logcat-error)] hover:bg-[var(--logcat-error)]/10',
  F: 'border-[var(--logcat-fatal)]/40 text-[var(--logcat-fatal)] font-bold hover:bg-[var(--logcat-fatal)]/20',
}

const LEVEL_ACTIVE_BG: Record<LogcatLevel, string> = {
  V: 'bg-muted-foreground/20',
  D: 'bg-[var(--logcat-debug)]/20',
  I: 'bg-[var(--logcat-info)]/20',
  W: 'bg-[var(--logcat-warn)]/20',
  E: 'bg-[var(--logcat-error)]/20',
  F: 'bg-[var(--logcat-error)]/30',
}

export function LogcatFilters() {
  const filter = useLogcatStore((state) => state.filter)
  const setFilter = useLogcatStore((state) => state.setFilter)

  function toggleLevel(level: LogcatLevel) {
    const next = filter.levels.includes(level)
      ? filter.levels.filter((l) => l !== level)
      : [...filter.levels, level]

    if (next.length > 0) {
      setFilter({ levels: next })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border/40 bg-muted/20">
      <div className="flex items-center gap-1.5">
        {LEVELS.map(({ value, label }) => {
          const isActive = filter.levels.includes(value)

          return (
            <Badge
              key={value}
              variant="outline"
              className={cn(
                'cursor-pointer text-[10px] h-5 px-1.5 gap-0.5 transition-colors',
                LEVEL_BADGE_COLORS[value],
                isActive && LEVEL_ACTIVE_BG[value],
              )}
              onClick={() => toggleLevel(value)}
              title={`${label} (${value})`}
            >
              {value}
            </Badge>
          )
        })}
      </div>

      <div className="h-4 w-px bg-border/40" />

      <Input
        value={filter.tag}
        onChange={(e) => setFilter({ tag: e.target.value })}
        placeholder="Filter by tag..."
        className="h-6 w-36 text-xs rounded-lg"
      />

      <Input
        value={filter.text}
        onChange={(e) => setFilter({ text: e.target.value })}
        placeholder="Search messages..."
        className="h-6 w-48 text-xs rounded-lg"
      />
    </div>
  )
}
