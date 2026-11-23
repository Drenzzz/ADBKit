import { useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { IconTerminal } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface TerminalViewProps {
  className?: string
  output: string
  onResize: () => void
}

const TERMINAL_VIRTUALIZATION_THRESHOLD = 1000
const TERMINAL_ROW_HEIGHT = 24

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

    if (trimmed.startsWith('$')) {
      const cmdPart = line.substring(line.indexOf('$') + 1)
      const prevLine = idx > 0 ? lines[idx - 1].trim() : ''
      const showSpacer = idx > 0 && prevLine !== ''
      return (
        <div
          className={cn('font-mono text-[14px] leading-6', showSpacer && 'mt-4')}
          key={idx}
        >
          <span className="font-semibold text-[var(--color-accent)] select-none">$</span>
          <span className="font-semibold text-[var(--color-text-primary)]">{cmdPart}</span>
        </div>
      )
    }

    const lowerLine = trimmed.toLowerCase()
    if (
      lowerLine.includes('error') ||
      lowerLine.includes('failed') ||
      lowerLine.includes('exception') ||
      lowerLine.includes('err:')
    ) {
      return (
        <div key={idx} className="font-mono text-[14px] leading-6 font-semibold text-[var(--logcat-error)] whitespace-pre-wrap break-all">
          {line}
        </div>
      )
    }

    if (
      trimmed.includes('OKAY [') ||
      trimmed.includes('Finished. Total time:') ||
      trimmed.startsWith('Rebooting')
    ) {
      return (
        <div key={idx} className="font-mono text-[14px] leading-6 font-semibold text-[var(--color-success)] whitespace-pre-wrap break-words">
          {line}
        </div>
      )
    }

    return (
      <div key={idx} className="font-mono text-[14px] leading-6 text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
        {line}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full w-full overflow-auto bg-[var(--color-surface-inset)] px-5 py-4 font-mono text-[14px] leading-6 text-[var(--color-text-primary)] select-text selection:bg-[var(--color-accent)]/20 selection:text-[var(--color-text-primary)]',
        className,
      )}
    >
      {lines.length === 0 || (lines.length === 1 && lines[0] === '') ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 font-sans select-none">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-background-card)] text-[var(--color-text-secondary)]">
            <IconTerminal size={24} stroke={1.75} />
          </div>
          <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">No output yet</p>
          <p className="max-w-xs text-center text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            Connect a session and send a command to see output here
          </p>
        </div>
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