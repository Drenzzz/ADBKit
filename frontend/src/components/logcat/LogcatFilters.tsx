import { useMemo } from 'react'
import type { LogcatLevel } from '@/lib/types'
import { useLogcatStore } from '@/stores/useLogcatStore'
import { cn } from '@/lib/utils'

const LEVELS: { value: LogcatLevel; label: string }[] = [
  { value: 'V', label: 'Verbose' },
  { value: 'D', label: 'Debug' },
  { value: 'I', label: 'Info' },
  { value: 'W', label: 'Warn' },
  { value: 'E', label: 'Error' },
  { value: 'F', label: 'Fatal' },
]

const LEVEL_GLYPH: Record<LogcatLevel, string> = {
  V: 'bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)]',
  D: 'bg-[var(--logcat-debug)]/10 text-[var(--logcat-debug)]',
  I: 'bg-[var(--logcat-info)]/10 text-[var(--logcat-info)]',
  W: 'bg-[var(--logcat-warn)]/10 text-[var(--logcat-warn)]',
  E: 'bg-[var(--logcat-error)]/10 text-[var(--logcat-error)]',
  F: 'bg-[var(--logcat-error)]/20 text-[var(--logcat-fatal)]',
}

export function LogcatFilters() {
  const filter = useLogcatStore((state) => state.filter)
  const setFilter = useLogcatStore((state) => state.setFilter)
  const logs = useLogcatStore((state) => state.logs)

  const counts = useMemo(() => {
    const next: Record<string, number> = { V: 0, D: 0, I: 0, W: 0, E: 0, F: 0 }
    for (const entry of logs) next[entry.level] = (next[entry.level] ?? 0) + 1
    return next
  }, [logs])

  function toggleLevel(level: LogcatLevel) {
    const next = filter.levels.includes(level)
      ? filter.levels.filter((l) => l !== level)
      : [...filter.levels, level]

    if (next.length > 0) {
      setFilter({ levels: next })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[14px] font-semibold text-[var(--color-text-secondary)]">Levels</p>
        <div className="flex flex-col gap-1">
          {LEVELS.map(({ value, label }) => {
            const isActive = filter.levels.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleLevel(value)}
                aria-pressed={isActive}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
                  isActive
                    ? 'bg-[var(--color-background-card)]'
                    : 'opacity-50 hover:bg-[var(--color-background-card)]/60 hover:opacity-80',
                )}
              >
                <span className={cn('grid size-6 shrink-0 place-items-center rounded-md text-[14px] font-bold', LEVEL_GLYPH[value])}>
                  {value}
                </span>
                <span className="flex-1 text-[15px] font-medium text-[var(--color-text-primary)]">{label}</span>
                <span className="text-[14px] text-[var(--color-text-secondary)] tabular-nums">
                  {counts[value].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[14px] font-semibold text-[var(--color-text-secondary)]">Filter</p>
        <input
          value={filter.tag}
          onChange={(e) => setFilter({ tag: e.target.value })}
          placeholder="Tag"
          aria-label="Filter by tag"
          className="h-11 w-full rounded-full bg-[var(--color-background-card)] px-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        />
        <input
          value={filter.text}
          onChange={(e) => setFilter({ text: e.target.value })}
          placeholder="Search messages"
          aria-label="Search messages"
          className="h-11 w-full rounded-full bg-[var(--color-background-card)] px-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        />
      </div>
    </div>
  )
}