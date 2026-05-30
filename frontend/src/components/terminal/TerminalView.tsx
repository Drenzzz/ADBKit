import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { cn } from '@/lib/utils'

function normalizeTerminalOutput(chunk: string): string {
  return chunk.replace(/\r?\n/g, '\r\n')
}

const XTERM_THEME_DARK = {
  background: '#0f1117',
  foreground: '#e2e8f0',
  cursor: '#94a3b8',
  cursorAccent: '#0f1117',
  selectionBackground: '#33415599',
  black: '#0f1117',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#e2e8f0',
  brightBlack: '#475569',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#facc15',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#f8fafc',
}

const XTERM_THEME_LIGHT = {
  background: '#ffffff',
  foreground: '#1e293b',
  cursor: '#64748b',
  cursorAccent: '#ffffff',
  selectionBackground: '#cbd5e199',
  black: '#1e293b',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#ca8a04',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#f8fafc',
  brightBlack: '#64748b',
  brightRed: '#ef4444',
  brightGreen: '#22c55e',
  brightYellow: '#eab308',
  brightBlue: '#3b82f6',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#ffffff',
}

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

interface TerminalViewProps {
  className?: string
  output: string
  onResize: () => void
}

export function TerminalView({ className, output, onResize }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const outputLengthRef = useRef(0)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
      scrollback: 10000,
      theme: isDarkMode() ? XTERM_THEME_DARK : XTERM_THEME_LIGHT,
      allowProposedApi: true,
    })

    // Allow Ctrl+C / Cmd+C to copy when text is selected
    term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && event.type === 'keydown') {
        if (term.hasSelection()) {
          return false
        }
      }

      if (event.ctrlKey && event.shiftKey && event.key === 'C' && event.type === 'keydown') {
        if (term.hasSelection()) {
          return false
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && event.type === 'keydown') {
        return false
      }

      return true
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current)

    terminalRef.current = term
    fitAddonRef.current = fitAddon

    fitAddon.fit()
    setIsReady(true)

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    })

    resizeObserver.observe(containerRef.current)

    const mutationObserver = new MutationObserver(() => {
      if (terminalRef.current) {
        terminalRef.current.options.theme = isDarkMode()
          ? XTERM_THEME_DARK
          : XTERM_THEME_LIGHT
      }
    })

    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      term.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  useEffect(() => {
    const term = terminalRef.current
    if (!term || !isReady) {
      return
    }

    if (output.length < outputLengthRef.current) {
      term.clear()
      outputLengthRef.current = 0
    }

    const nextChunk = output.slice(outputLengthRef.current)
    if (nextChunk) {
      term.write(normalizeTerminalOutput(nextChunk))
      outputLengthRef.current = output.length
    }
  }, [isReady, output])

  useEffect(() => {
    if (fitAddonRef.current && isReady) {
      fitAddonRef.current.fit()
      const term = terminalRef.current
      if (term) {
        onResize()
      }
    }
  }, [isReady, onResize])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn('h-full w-full overflow-hidden outline-none', className)}
    />
  )
}
