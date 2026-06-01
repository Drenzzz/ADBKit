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
        'h-full w-full overflow-auto bg-[#0f1117] px-4 py-3 font-mono text-xs leading-5 text-slate-200',
        className,
      )}
    >
      {lines.length === 0 || (lines.length === 1 && lines[0] === '') ? (
        <div className="text-slate-500">No terminal output yet.</div>
      ) : (
        <div className="whitespace-pre-wrap break-words">
          {output}
        </div>
      )}
    </div>
  )
}
