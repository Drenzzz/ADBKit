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
  D: 'border-blue-400/30 text-blue-400 hover:bg-blue-400/10',
  I: 'border-green-400/30 text-green-400 hover:bg-green-400/10',
  W: 'border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10',
  E: 'border-red-400/30 text-red-400 hover:bg-red-400/10',
  F: 'border-red-400/40 text-red-400 font-bold hover:bg-red-400/20',
}

const LEVEL_ACTIVE_BG: Record<LogcatLevel, string> = {
  V: 'bg-muted-foreground/20',
  D: 'bg-blue-400/20',
  I: 'bg-green-400/20',
  W: 'bg-yellow-400/20',
  E: 'bg-red-400/20',
  F: 'bg-red-400/30',
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
                'cursor-pointer text-[10px] h-5 px-1.5 gap-0.5 transition-all',
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
