import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { NoDeviceEmptyState } from '@/components/common/NoDeviceEmptyState'
import {
  CornerDownLeft,
  Terminal as TerminalIcon,
  Trash2,
  Loader2,
  Wifi,
  History,
  X,
  ScrollText,
  ChevronDown,
  RotateCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TerminalMode } from '@/lib/types'
import { useTerminalStore } from '@/stores/useTerminalStore'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { useDevices } from '@/hooks/useDevices'
import {
  startTerminalSession,
  sendTerminalInput,
  closeTerminal,
  onTerminalOutput,
  onTerminalClosed,
} from '@/services/terminalService'
import { TerminalView } from '@/components/terminal/TerminalView'
import { CommandHistory } from '@/components/terminal/CommandHistory'
import { LogcatWorkspace } from '@/components/logcat/LogcatWorkspace'

type TerminalWorkspacePanel = 'shell' | 'logcat'

const MODE_OPTIONS: { value: TerminalMode; label: string }[] = [
  { value: 'adb-shell', label: 'ADB Shell' },
  { value: 'adb-host', label: 'ADB Host' },
  { value: 'fastboot-host', label: 'Fastboot' },
]

const containerVariants = (reduced: boolean) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: reduced
      ? { duration: 0, staggerChildren: 0 }
      : { staggerChildren: 0.05 },
  },
})

const itemVariants = (reduced: boolean) => ({
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: reduced
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
})

export default function TerminalPage() {
  const reduced = useReducedMotion()
  const {
    session,
    output,
    mode,
    connecting,
    connected,
    error,
    clearOutput,
    setSession,
    setMode,
    setConnecting,
    setConnected,
    setError,
    appendOutput,
    applyClosedEvent,
    pushHistory,
  } = useTerminalStore()

  const activeSerial = useDeviceStore((state) => state.activeSerial)
  const { refreshDevices, refreshing } = useDevices()
  const [command, setCommand] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [activePanel, setActivePanel] =
    useState<TerminalWorkspacePanel>('shell')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const savedCommandRef = useRef('')
  const outputBufferRef = useRef('')
  const flushTimerRef = useRef<number | null>(null)
  const history = useTerminalStore((state) => state.history)

  function modeLabel(m: TerminalMode): string {
    return MODE_OPTIONS.find((o) => o.value === m)?.label ?? 'ADB Shell'
  }

  function placeholderText(
    nextMode: TerminalMode,
    isSessionConnected: boolean,
  ): string {
    if (!isSessionConnected) return 'Connect a terminal session first'
    switch (nextMode) {
      case 'adb-host':
        return 'Type adb host command arguments, e.g. install app.apk'
      case 'fastboot-host':
        return 'Type fastboot command arguments, e.g. getvar all'
      default:
        return 'Type shell command and press Enter'
    }
  }

  function canConnect(nextMode: TerminalMode): boolean {
    if (nextMode === 'fastboot-host') return true
    return activeSerial !== ''
  }

  const handleResize = useCallback(() => {}, [])

  const handleOutputEvent = useCallback(
    (data: string) => {
      outputBufferRef.current += data
      if (!flushTimerRef.current) {
        flushTimerRef.current = window.setTimeout(() => {
          if (outputBufferRef.current !== '') {
            appendOutput(outputBufferRef.current)
            outputBufferRef.current = ''
          }
          flushTimerRef.current = null
        }, 16)
      }
    },
    [appendOutput],
  )

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    clearOutput()
    try {
      const newSession = await startTerminalSession(mode, activeSerial)
      setSession(newSession)
      setConnected(true)
      toast.success(
        `Connected to ${newSession.serial} via ${modeLabel(newSession.mode)}`,
      )
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : 'Failed to start terminal session'
      setError(message)
      toast.error(message)
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!session) return
    try {
      await closeTerminal(session.id)
      toast.info('Terminal session closed')
    } catch {
      setSession(null)
      setConnected(false)
      toast.error('Failed to close terminal session')
    }
  }

  async function handleSubmitCommand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || command.trim() === '') return

    const nextCommand = command.trim()
    setCommand('')
    setHistoryIndex(-1)
    savedCommandRef.current = ''
    pushHistory(nextCommand, session.serial, mode)

    try {
      await sendTerminalInput(session.id, `${nextCommand}\n`)
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : 'Failed to send terminal command'
      setError(message)
      toast.error(message)
    }
  }

  function handleReExecuteCommand(cmd: string) {
    setCommand(cmd)
    setShowHistory(false)
    setHistoryIndex(-1)
    toast.info(`Loaded command: ${cmd}`)
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return
      const nextIndex = historyIndex + 1
      if (nextIndex >= history.length) return
      if (historyIndex === -1) {
        savedCommandRef.current = command
      }
      setHistoryIndex(nextIndex)
      setCommand(history[nextIndex]?.command ?? '')
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex <= -1) return
      const nextIndex = historyIndex - 1
      if (nextIndex < 0) {
        setHistoryIndex(-1)
        setCommand(savedCommandRef.current)
      } else {
        setHistoryIndex(nextIndex)
        setCommand(history[nextIndex]?.command ?? '')
      }
    }
  }

  function handleModeChange(nextMode: TerminalMode) {
    if (connected) {
      toast.info('Disconnect current session before changing terminal mode')
      return
    }
    setMode(nextMode)
    setError(null)
  }

  useEffect(() => {
    const unsubscribeOutput = onTerminalOutput((event) => {
      if (session && event.sessionId === session.id) {
        handleOutputEvent(event.data)
      }
    })
    const unsubscribeClosed = onTerminalClosed((event) => {
      if (session && event.sessionId === session.id) {
        applyClosedEvent(event)
      }
    })
    return () => {
      unsubscribeOutput()
      unsubscribeClosed()
    }
  }, [session, applyClosedEvent, handleOutputEvent])

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
    }
  }, [])

  return (
    <motion.div
      variants={containerVariants(reduced)}
      initial="hidden"
      animate="show"
      className="relative flex h-full min-h-0 flex-col gap-4 overflow-hidden pb-0 font-sans"
    >
      {!activeSerial && !connected ? (
        <div className="flex-1 flex flex-col">
          <motion.div variants={itemVariants(reduced)} className="flex flex-col gap-1 mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Terminal</h1>
            <p className="text-xs text-muted-foreground">
              Run shell commands, inspect logcat, and manage live terminal sessions
            </p>
          </motion.div>
          <NoDeviceEmptyState feature="terminal sessions" />
        </div>
      ) : (
        <>
      {/* Title Header */}
      <motion.div variants={itemVariants(reduced)} className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Terminal</h1>
        <p className="text-xs text-muted-foreground">
          Run shell commands, inspect logcat, and manage live terminal sessions
        </p>
      </motion.div>

      {/* Obsidian macOS-Style Window Container */}
      <motion.div
        variants={itemVariants(reduced)}
        className="flex-1 min-h-0 overflow-hidden flex flex-col rounded-2xl border border-border bg-white dark:bg-[var(--terminal-bg)] shadow-[var(--shadow-floating)] relative"
      >
        
        {/* macOS Window Header (Title Bar) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 dark:bg-zinc-900 border-b border-border dark:border-zinc-950 select-none">
          {/* Left: Window Dots (hover shows miniature symbols) */}
          <div className="flex items-center gap-2 group/dots w-20">
            <button
              onClick={connected ? handleDisconnect : undefined}
              className={cn(
                "w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold transition-colors relative border border-transparent outline-none",
                connected 
                  ? "bg-[var(--traffic-light-red)] hover:bg-[var(--traffic-light-red)]/80 text-[color:var(--destructive)]/50 cursor-pointer" 
                  : "bg-muted dark:bg-zinc-700 text-muted-foreground dark:text-zinc-800 cursor-not-allowed"
              )}
              title={connected ? "Disconnect session" : "No active session"}
            >
              <span className="opacity-0 group-hover/dots:opacity-100 absolute -top-0.5">×</span>
            </button>
            <div className="w-3 h-3 rounded-full bg-[var(--traffic-light-yellow)] relative flex items-center justify-center text-[7px] font-bold text-[color:var(--warning)]/50">
              <span className="opacity-0 group-hover/dots:opacity-100 absolute -top-0.5">-</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[var(--traffic-light-green)] relative flex items-center justify-center text-[7px] font-bold text-[color:var(--success)]/50">
              <span className="opacity-0 group-hover/dots:opacity-100 absolute -top-0.5">+</span>
            </div>
          </div>

          {/* Center: iOS Segmented Tabs */}
          <div className="flex items-center gap-0.5 rounded-full border border-border dark:border-zinc-800 bg-muted/50 dark:bg-zinc-950 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
            <button
              onClick={() => setActivePanel('shell')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-semibold transition-colors duration-200 cursor-pointer',
                activePanel === 'shell'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-foreground shadow-sm'
                  : 'text-muted-foreground dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-200',
              )}
            >
              <TerminalIcon className="h-3.5 w-3.5" />
              Shell
            </button>
            <button
              onClick={() => setActivePanel('logcat')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-semibold transition-colors duration-200 cursor-pointer',
                activePanel === 'logcat'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-foreground shadow-sm'
                  : 'text-muted-foreground dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-200',
              )}
            >
              <ScrollText className="h-3.5 w-3.5" />
              Logcat
            </button>
          </div>

          {/* Right: Window Session Label */}
          <div className="text-[10px] font-mono text-muted-foreground dark:text-zinc-500 w-20 text-right truncate">
            {connected && session ? `${session.serial}` : 'idle'}
          </div>
        </div>

        {/* Content Pane */}
        {activePanel === 'shell' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-2 border-b border-border dark:border-zinc-950">
              {/* Dropdown Mode Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={connected}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-full border border-border dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-[colors,transform] cursor-pointer shadow-sm active:scale-[0.97]',
                    connected && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {modeLabel(mode)}
                  <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white dark:bg-zinc-900 border-border dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-xl shadow-[var(--shadow-raised)]">
                  {MODE_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => handleModeChange(opt.value)}
                      className={cn(
                        'text-xs rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-foreground dark:focus:text-white',
                        mode === opt.value && 'font-bold text-primary',
                      )}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status indicators */}
              {connected && session && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--success)] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                  Connected
                </span>
              )}
              {connecting && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-zinc-400 font-semibold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Connecting...
                </span>
              )}
              {!connected && !connecting && activeSerial && (
                <span className="text-xs text-muted-foreground dark:text-zinc-500 font-mono">
                  Target: {activeSerial}
                </span>
              )}

              <div className="flex-1" />

              {/* Console control actions */}
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'h-7 w-7 p-0 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer',
                    refreshing && 'animate-spin',
                  )}
                  onClick={refreshDevices}
                  disabled={refreshing}
                  title="Refresh devices"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'h-7 w-7 p-0 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer',
                    showHistory && 'bg-zinc-200 dark:bg-zinc-800 text-foreground dark:text-foreground',
                  )}
                  onClick={() => setShowHistory(!showHistory)}
                  title="Command history"
                >
                  <History className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  onClick={clearOutput}
                  disabled={!session}
                  title="Clear output"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="h-4 w-px bg-border dark:bg-zinc-800 mx-1" />

                {connected ? (
                  <Button
                    size="sm"
                    className="h-7 text-xs font-semibold px-4 rounded-full bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 text-white border-0 transition-[colors,transform] active:scale-[0.97] cursor-pointer shadow-sm"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 text-xs font-semibold px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/95 border-0 transition-[colors,transform] active:scale-[0.97] cursor-pointer shadow-sm gap-1.5"
                    onClick={handleConnect}
                    disabled={connecting || !canConnect(mode)}
                  >
                    {connecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wifi className="h-3.5 w-3.5" />
                    )}
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Terminal view window screen */}
            <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-[var(--terminal-bg)]">
              <TerminalView
                className="h-full w-full"
                output={output}
                onResize={handleResize}
              />
            </div>

            {/* Integrated Input Form */}
            <form
              className="flex items-center gap-2 border-t border-border dark:border-zinc-950 bg-zinc-50 dark:bg-[var(--terminal-bg)]/90 px-4 py-2.5"
              onSubmit={handleSubmitCommand}
            >
              <span className="font-mono text-xs text-[var(--logcat-info)] font-bold select-none shrink-0 ml-1">
                $
              </span>
              <Input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={placeholderText(mode, connected)}
                className="h-8 rounded-full font-mono text-xs border border-border dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-visible:ring-1 focus-visible:ring-ring dark:focus-visible:ring-zinc-700 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-650 outline-none"
                disabled={!connected || !session}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 gap-1.5 text-xs shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/95 border-0 transition-[colors,transform] active:scale-[0.97] cursor-pointer px-4 shadow-sm font-semibold"
                disabled={!connected || !session || command.trim() === ''}
              >
                <CornerDownLeft className="h-3.5 w-3.5" />
                Send
              </Button>
            </form>

            {/* Errors / helper footer */}
            {error && (
              <div className="px-5 py-2 border-t border-border dark:border-zinc-950 bg-[var(--destructive)]/5 dark:bg-[var(--destructive)]/10 text-xs text-[var(--destructive)]">
                {error}
              </div>
            )}
            {!canConnect(mode) && !error && !connected && (
              <div className="px-5 py-2 border-t border-border dark:border-zinc-950 bg-zinc-50 dark:bg-zinc-950/30 text-xs text-muted-foreground font-medium">
                {mode === 'fastboot-host'
                  ? 'Fastboot mode does not require an active ADB device selection.'
                  : 'No device selected. Select a device first.'}
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 bg-white dark:bg-[var(--terminal-bg)] select-text">
            <LogcatWorkspace embedded />
          </div>
        )}

        {/* macOS-style Command History Drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute inset-y-0 right-0 z-50 w-80 border-l border-border dark:border-zinc-800 bg-white/95 dark:bg-[var(--terminal-bg)]/95 backdrop-blur-md shadow-[var(--shadow-floating)] flex flex-col"
            >
              <div className="absolute left-0 top-3 -ml-3">
                <Button
                  size="icon"
                  className="h-6 w-6 rounded-full p-0 shadow-md border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                  onClick={() => setShowHistory(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <CommandHistory onReExecute={handleReExecuteCommand} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
        </>
      )}
    </motion.div>
  )
}
