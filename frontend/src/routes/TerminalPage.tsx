import { useCallback, useEffect, useRef, useState } from 'react'
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

export default function TerminalPage() {
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
    <div className="relative flex h-full min-h-0 flex-col gap-4 overflow-hidden pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">
          Terminal
        </h1>
        <p className="text-sm text-muted-foreground">
          Run shell commands, inspect logcat, and manage live terminal sessions
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border/40 bg-muted/30 p-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePanel('shell')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 h-auto text-xs font-medium transition-colors hover:bg-transparent',
              activePanel === 'shell'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <TerminalIcon className="h-3 w-3" />
            Shell
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePanel('logcat')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 h-auto text-xs font-medium transition-colors hover:bg-transparent',
              activePanel === 'logcat'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <ScrollText className="h-3 w-3" />
            Logcat
          </Button>
        </div>

        {activePanel === 'shell' && (
          <>
            <div className="h-3.5 w-px bg-border/50 shrink-0" />

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={connected}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2 py-1 h-auto text-xs transition-colors shrink-0',
                    connected
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  {modeLabel(mode)}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {MODE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleModeChange(opt.value)}
                    className={cn(
                      'text-xs',
                      mode === opt.value && 'font-medium',
                    )}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {connected && session && (
              <>
                <div className="h-3.5 w-px bg-border/50 shrink-0" />
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">{session.serial}</span>
                </span>
              </>
            )}
            {connecting && (
              <>
                <div className="h-3.5 w-px bg-border/50 shrink-0" />
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  Connecting...
                </span>
              </>
            )}
            {!connected && !connecting && activeSerial && (
              <>
                <div className="h-3.5 w-px bg-border/50 shrink-0" />
                <span className="text-xs text-muted-foreground/60 truncate">
                  {activeSerial}
                </span>
              </>
            )}
          </>
        )}

        <div className="flex-1" />

        {activePanel === 'shell' && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 w-7 p-0 text-muted-foreground hover:text-foreground',
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
                'h-7 w-7 p-0 text-muted-foreground hover:text-foreground',
                showHistory && 'bg-muted text-foreground',
              )}
              onClick={() => setShowHistory(!showHistory)}
              title="Command history"
            >
              <History className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={clearOutput}
              disabled={!session}
              title="Clear output"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <div className="h-3.5 w-px bg-border/50 mx-0.5" />

            {connected ? (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs px-3"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-7 text-xs px-3 gap-1.5"
                onClick={handleConnect}
                disabled={connecting || !canConnect(mode)}
              >
                {connecting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wifi className="h-3 w-3" />
                )}
                Connect
              </Button>
            )}
          </div>
        )}
      </div>

      {activePanel === 'shell' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#0f1117]">
            <TerminalView
              className="h-full w-full"
              output={output}
              onResize={handleResize}
            />
          </div>

          <form
            className="flex items-center gap-2 border-t border-border/40 bg-background px-4 py-2.5"
            onSubmit={handleSubmitCommand}
          >
            <span className="font-mono text-xs text-muted-foreground select-none shrink-0">
              $
            </span>
            <Input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholderText(mode, connected)}
              className="h-8 rounded-lg font-mono text-xs border-0 bg-muted/30 focus-visible:ring-1 focus-visible:ring-border"
              disabled={!connected || !session}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0"
              disabled={!connected || !session || command.trim() === ''}
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
              Send
            </Button>
          </form>

          {error && (
            <div className="px-4 py-1.5 border-t border-border/40 text-xs text-destructive">
              {error}
            </div>
          )}
          {!canConnect(mode) && !error && !connected && (
            <div className="px-4 py-1.5 border-t border-border/40 text-xs text-muted-foreground">
              {mode === 'fastboot-host'
                ? 'Fastboot mode does not require an active ADB device selection.'
                : 'No device selected. Connect a device first.'}
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <LogcatWorkspace embedded />
        </div>
      )}

      {showHistory && (
        <div className="absolute inset-y-0 right-0 z-50 w-80 border-l border-border/40 bg-background shadow-xl">
          <div className="absolute left-0 top-3 -ml-3">
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 rounded-full p-0 shadow-md"
              onClick={() => setShowHistory(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <CommandHistory onReExecute={handleReExecuteCommand} />
        </div>
      )}
    </div>
  )
}
