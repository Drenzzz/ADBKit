import { useMemo, useState } from 'react'
import {
  IconClock as Clock,
  IconTrash as Trash2,
  IconX as X,
  IconSend as Send,
} from "@tabler/icons-react"
import { useTerminalStore } from '@/stores/useTerminalStore'
import type { TerminalHistoryEntry } from '@/lib/types'

interface CommandHistoryProps {
  onReExecute: (command: string) => void
  onClose: () => void
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

export function CommandHistory({ onReExecute, onClose }: CommandHistoryProps) {
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
        <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">Command history</p>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              type="button"
              aria-label="Clear all history"
              onClick={clearHistory}
              className="flex size-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-error)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              <Trash2 size={17} stroke={1.75} />
            </button>
          )}
          <button
            type="button"
            aria-label="Close history"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          >
            <X size={17} stroke={1.75} />
          </button>
        </div>
      </div>

      <div className="border-b border-border/40 px-4 py-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Filter history"
          aria-label="Filter history"
          className="h-11 w-full rounded-full bg-[var(--color-surface-inset)] px-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-surface-inset)] text-[var(--color-text-secondary)]">
              <Clock size={22} stroke={1.75} />
            </div>
            <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              {searchTerm ? 'No matching commands' : 'No command history yet'}
            </p>
            <p className="max-w-[220px] text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              Use Arrow Up/Down in the terminal to cycle through commands
            </p>
          </div>
        ) : (
          <div className="py-1">
            {groups.map((group, groupIndex) => (
              <div key={`${group.key}-${groupIndex}`} className="mb-2">
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/40 bg-[var(--color-surface-container)]/95 px-4 py-2 backdrop-blur-sm">
                  <span className="max-w-[150px] truncate font-mono text-[13px] font-medium text-[var(--color-text-secondary)]">
                    {group.serial}
                  </span>
                  <span className="text-[14px] font-semibold text-[var(--color-text-secondary)]">
                    {formatMode(group.mode)}
                  </span>
                </div>

                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-background-card)]/60"
                  >
                    <code className="min-w-0 select-all truncate font-mono text-[15px] text-[var(--color-text-primary)]">
                      {entry.command}
                    </code>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="font-mono text-[13px] text-[var(--color-text-secondary)] group-hover:hidden">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <div className="hidden items-center gap-0.5 group-hover:flex">
                        <button
                          type="button"
                          aria-label="Load command"
                          onClick={() => onReExecute(entry.command)}
                          className="flex size-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--color-surface-inset)] hover:text-[var(--color-text-primary)] active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] motion-reduce:transition-none motion-reduce:active:scale-100"
                        >
                          <Send size={15} stroke={1.75} />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove entry"
                          onClick={() => removeHistoryEntry(entry.id)}
                          className="flex size-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--color-surface-inset)] hover:text-[var(--color-error)] active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] motion-reduce:transition-none motion-reduce:active:scale-100"
                        >
                          <X size={15} stroke={1.75} />
                        </button>
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