import { useMemo, useState } from 'react'
import {
  IconClock as Clock,
  IconTrash as Trash2,
  IconX as X,
  IconSend as Send,
  IconHistory as History
} from "@tabler/icons-react"
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
    <div className="flex h-full flex-col bg-[var(--terminal-bg)]/95 backdrop-blur-md text-zinc-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-bold tracking-wide uppercase text-zinc-200">History</span>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              onClick={clearHistory}
              title="Clear all history"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Input */}
      <div className="border-b border-zinc-800/80 px-4 py-2 bg-muted/20">
        <Input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Filter history..."
          className="h-8 w-full rounded-full border-zinc-800 bg-zinc-900/60 px-3.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:bg-zinc-900 focus:border-zinc-700 outline-none"
        />
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Clock className="h-7 w-7 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">
              {searchTerm ? 'No matching commands' : 'No command history yet'}
            </p>
            <p className="mt-1 text-[10px] text-zinc-500 leading-normal max-w-[180px]">
              Use Arrow Up/Down in terminal to cycle through commands
            </p>
          </div>
        ) : (
          <div className="py-1">
            {groups.map((group, groupIndex) => (
              <div key={`${group.key}-${groupIndex}`} className="mb-2">
                {/* Session Header */}
                <div className="sticky top-0 z-10 flex items-center gap-1.5 bg-[var(--terminal-surface)]/90 px-4 py-1 border-b border-zinc-900/40 backdrop-blur-sm">
                  <span className="text-[10px] font-mono font-medium text-zinc-400 truncate max-w-[130px]">
                    {group.serial}
                  </span>
                  <span className="text-[10px] text-zinc-700">·</span>
                  <span className="text-[10px] font-semibold text-zinc-500">
                    {formatMode(group.mode)}
                  </span>
                </div>

                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-center justify-between gap-3 px-4 py-2 hover:bg-zinc-800/30 transition-colors"
                  >
                    <code className="truncate text-xs font-mono text-zinc-200 min-w-0 select-all">
                      {entry.command}
                    </code>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-500 font-mono group-hover:hidden">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                          onClick={() => onReExecute(entry.command)}
                          title="Load command"
                        >
                          <Send className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 rounded-full text-zinc-500 hover:text-[var(--destructive)] hover:bg-zinc-800"
                          onClick={() => removeHistoryEntry(entry.id)}
                          title="Remove entry"
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
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
