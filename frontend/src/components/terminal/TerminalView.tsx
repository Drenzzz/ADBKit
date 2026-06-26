import { useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TerminalViewProps {
  className?: string
  output: string
  onResize: () => void
}

export function TerminalView({ className, output, onResize }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => output.split(/\r?\n/), [output])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [output])

  useEffect(() => {
    onResize()
  }, [onResize, output])

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full w-full overflow-auto bg-white dark:bg-[var(--terminal-bg)] px-5 py-4 font-mono text-xs leading-5 text-zinc-700 dark:text-zinc-300 perf-scroll select-text selection:bg-primary/20 dark:selection:bg-primary/30 selection:text-zinc-900 dark:selection:text-white',
        className,
      )}
    >
      {lines.length === 0 || (lines.length === 1 && lines[0] === '') ? (
        <div className="text-zinc-400 dark:text-zinc-600 italic select-none">No terminal output yet.</div>
      ) : (
        <div className="space-y-0.5">
          {lines.map((line, idx) => {
            const trimmed = line.trim()

            // Highlight commands prompt
            if (trimmed.startsWith('$')) {
              const cmdPart = line.substring(line.indexOf('$') + 1)
              const prevLine = idx > 0 ? lines[idx - 1].trim() : ''
              const showSpacer = idx > 0 && prevLine !== ''
              return (
                <div 
                  key={idx} 
                  className={cn("font-mono leading-5", showSpacer && "mt-4")}
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
          })}
        </div>
      )}
    </div>
  )
}
