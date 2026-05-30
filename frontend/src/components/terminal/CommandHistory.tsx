import { useMemo, useState } from 'react'
import { Clock, Trash2, X, Send, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTerminalStore } from '@/stores/useTerminalStore'
import type { TerminalHistoryEntry } from '@/lib/types'

interface CommandHistoryProps {
  onReExecute: (command: string) => void
}

interface HistoryGroup {
  key: string
  serial: string
  mode: string
  entries: TerminalHistoryEntry[]
}

function groupBySession(entries: TerminalHistoryEntry[]): HistoryGroup[] {
  const groups: HistoryGroup[] = []

  for (const entry of entries) {
    const key = `${entry.serial}:${entry.mode}`
    const lastGroup = groups[groups.length - 1]

    if (lastGroup && lastGroup.key === key) {
      lastGroup.entries.push(entry)
    } else {
      groups.push({
        key,
        serial: entry.serial,
        mode: entry.mode,
        entries: [entry],
      })
    }
  }

  return groups
}

export function CommandHistory({ onReExecute }: CommandHistoryProps) {
  const { history, removeHistoryEntry, clearHistory } = useTerminalStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHistory = searchTerm.trim()
    ? history.filter((entry) =>
        entry.command.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : history

  const groups = useMemo(
    () => groupBySession(filteredHistory),
    [filteredHistory],
  )

  function formatTimestamp(timestamp: number) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay < 7) return `${diffDay}d ago`

    return date.toLocaleDateString()
  }

  function formatMode(mode: string): string {
    switch (mode) {
      case 'adb-shell':
        return 'Shell'
      case 'adb-host':
        return 'ADB'
      case 'fastboot-host':
        return 'Fastboot'
      default:
        return mode
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">History</span>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={clearHistory}
              title="Clear all history"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="border-b border-border/40 px-4 py-2">
        <Input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Filter history..."
          className="h-7 w-full rounded-lg border-border/40 bg-muted/30 px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">
              {searchTerm ? 'No matching commands' : 'No command history yet'}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              Use Arrow Up/Down in the input to cycle history
            </p>
          </div>
        ) : (
          <div className="py-1">
            {groups.map((group, groupIndex) => (
              <div key={`${group.key}-${groupIndex}`}>
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/40 px-4 py-1.5 backdrop-blur-sm">
                  <span className="text-[10px] font-medium text-muted-foreground truncate">
                    {group.serial}
                  </span>
                  <span className="text-[10px] text-border">·</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatMode(group.mode)}
                  </span>
                </div>

                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-center gap-2 px-4 py-1.5 hover:bg-muted/30"
                  >
                    <code className="flex-1 truncate text-xs font-mono text-foreground min-w-0">
                      {entry.command}
                    </code>
                    <span className="shrink-0 text-[10px] text-muted-foreground/60 tabular-nums">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={() => onReExecute(entry.command)}
                        title="Re-execute"
                      >
                        <Send className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={() => removeHistoryEntry(entry.id)}
                        title="Remove"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
