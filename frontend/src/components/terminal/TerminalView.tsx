import { useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'

interface TerminalViewProps {
  className?: string
  output: string
  onResize: () => void
}

const TERMINAL_VIRTUALIZATION_THRESHOLD = 1000
const TERMINAL_ROW_HEIGHT = 20

export function TerminalView({ className, output, onResize }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => output.split(/\r?\n/), [output])
  const shouldVirtualize = lines.length > TERMINAL_VIRTUALIZATION_THRESHOLD
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? lines.length : 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => TERMINAL_ROW_HEIGHT,
    overscan: 20,
  })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    if (shouldVirtualize) {
      virtualizer.scrollToIndex(lines.length - 1, { align: 'end' })
    } else {
      element.scrollTop = element.scrollHeight
    }
  }, [lines.length, output, shouldVirtualize, virtualizer])

  useEffect(() => {
    onResize()
  }, [onResize, output])

  function renderLine(line: string, idx: number) {
    const trimmed = line.trim()

    // Highlight commands prompt
    if (trimmed.startsWith('$')) {
      const cmdPart = line.substring(line.indexOf('$') + 1)
      const prevLine = idx > 0 ? lines[idx - 1].trim() : ''
      const showSpacer = idx > 0 && prevLine !== ''
      return (
        <div
          className={cn('font-mono leading-5', showSpacer && 'mt-4')}
          key={idx}
        >
          <span className="text-[var(--logcat-info)] dark:text-[var(--logcat-info)] font-semibold select-none">$</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{cmdPart}</span>
        </div>
      )
    }

    // Highlight errors
    const lowerLine = trimmed.toLowerCase()
    if (
      lowerLine.includes('error') ||
      lowerLine.includes('failed') ||
      lowerLine.includes('exception') ||
      lowerLine.includes('err:')
    ) {
      return (
        <div key={idx} className="font-mono leading-5 text-[var(--logcat-error)] dark:text-[var(--logcat-error)] font-semibold whitespace-pre-wrap break-all">
          {line}
        </div>
      )
    }

    // Highlight fastboot OKAY / Finished
    if (
      trimmed.includes('OKAY [') ||
      trimmed.includes('Finished. Total time:') ||
      trimmed.startsWith('Rebooting')
    ) {
      return (
        <div key={idx} className="font-mono leading-5 text-[var(--logcat-warn)] dark:text-[var(--logcat-warn)] font-semibold whitespace-pre-wrap break-words">
          {line}
        </div>
      )
    }

    return (
      <div key={idx} className="font-mono leading-5 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
        {line}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full w-full overflow-auto bg-white dark:bg-[var(--terminal-bg)] px-5 py-4 font-mono text-xs leading-5 text-zinc-700 dark:text-zinc-300 select-text selection:bg-primary/20 dark:selection:bg-primary/30 selection:text-zinc-900 dark:selection:text-white',
        className,
      )}
    >
      {lines.length === 0 || (lines.length === 1 && lines[0] === '') ? (
        <div className="text-zinc-400 dark:text-zinc-600 italic select-none">No terminal output yet.</div>
      ) : shouldVirtualize ? (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full pb-0.5"
              style={{
                transform: `translate3d(0, ${virtualRow.start}px, 0)`,
              }}
            >
              {renderLine(lines[virtualRow.index] ?? '', virtualRow.index)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {lines.map((line, idx) => renderLine(line, idx))}
        </div>
      )}
    </div>
  )
}
