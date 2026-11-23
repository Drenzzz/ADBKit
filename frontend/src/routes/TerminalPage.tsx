import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  IconCornerDownLeft as CornerDownLeft,
  IconTerminal as TerminalIcon,
  IconTrash as Trash2,
  IconHistory as History,
  IconArticle as ScrollText,
  IconRotate as RotateCw
} from "@tabler/icons-react"
import { toast } from '@/lib/toast'
import { Heading } from '@astryxdesign/core/Heading'
import { Button } from '@astryxdesign/core/Button'
import { SegmentedControl } from '@astryxdesign/core/SegmentedControl'
import { SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Selector } from '@astryxdesign/core/Selector'
import { cn } from '@/lib/utils'
import type { TerminalMode } from '@/lib/types'
import { getTerminalTargetSerial } from '@/lib/terminalTarget'
import { useTerminalStore } from '@/stores/useTerminalStore'
import { useLogcatStore } from '@/stores/useLogcatStore'
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
import { NoDeviceState } from '@/components/apps/EmptyStates'

type TerminalWorkspacePanel = 'shell' | 'logcat'

const MODE_OPTIONS: { value: TerminalMode; label: string }[] = [
  { value: 'adb-shell', label: 'ADB Shell' },
  { value: 'adb-host', label: 'ADB Host' },
  { value: 'fastboot-host', label: 'Fastboot' },
]

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

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
  const { devices, deviceMode, refreshDevices, refreshing } = useDevices()
  const targetSerial = getTerminalTargetSerial(mode, activeSerial, devices)
  const [command, setCommand] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [activePanel, setActivePanel] =
    useState<TerminalWorkspacePanel>('shell')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const savedCommandRef = useRef('')
  const outputBufferRef = useRef('')
  const flushTimerRef = useRef<number | null>(null)
  const history = useTerminalStore((state) => state.history)
  const logcatStreaming = useLogcatStore((state) => state.isStreaming)
  const logcatSerial = useLogcatStore((state) => state.streamingSerial)

  useEffect(() => {
    if (!connected && deviceMode === 'fastboot' && mode !== 'fastboot-host') {
      setMode('fastboot-host')
    }
  }, [connected, deviceMode, mode, setMode])

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
    return getTerminalTargetSerial(nextMode, activeSerial, devices) !== ''
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
      const newSession = await startTerminalSession(mode, targetSerial)
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

  const isShell = activePanel === 'shell'
  const stateSerial = isShell
    ? connected && session
      ? session.serial
      : targetSerial
    : logcatSerial || activeSerial
  const stateOk = isShell ? connected : logcatStreaming
  const stateLabel = isShell
    ? connected
      ? 'connected'
      : connecting
        ? 'connecting'
        : 'idle'
    : logcatStreaming
      ? 'streaming'
      : 'stopped'
  const hasDevice = targetSerial !== '' || devices.length > 0 || connected

  const iconButtonClass =
    'flex size-11 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-text-primary)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100'

  if (!hasDevice) {
    return (
      <div className="dashboard-scale flex h-full min-h-0 flex-col gap-4 p-5">
        <Heading level={1} type="display-1" weight="semibold">Terminal</Heading>
        <div className="min-h-0 flex-1">
          <NoDeviceState
            onRefresh={refreshDevices}
            refreshing={refreshing}
            description="Connect an Android device via USB or wireless to start a terminal session"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-scale flex h-full min-h-0 flex-col gap-4 p-5">
      <Heading level={1} type="display-1" weight="semibold" maxLines={1}>Terminal</Heading>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="m3-surface flex flex-wrap items-center gap-3 rounded-3xl px-5 py-4"
      >
          <SegmentedControl
            value={activePanel}
            onChange={(v) => setActivePanel(v as TerminalWorkspacePanel)}
            label="Terminal panel"
          >
            <SegmentedControlItem value="shell" label="Shell" icon={<TerminalIcon size={18} stroke={1.75} />} />
            <SegmentedControlItem value="logcat" label="Logcat" icon={<ScrollText size={18} stroke={1.75} />} />
          </SegmentedControl>

          {isShell && (
            <Selector
              label="Terminal mode"
              isLabelHidden
              value={mode}
              onChange={(v) => handleModeChange(v as TerminalMode)}
              options={MODE_OPTIONS}
              isDisabled={connected}
            />
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'h-2.5 w-2.5 shrink-0 rounded-full',
                stateOk
                  ? 'bg-[var(--color-success)] '
                  : 'bg-[var(--color-text-secondary)]/40',
              )}
            />
            <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              {stateSerial || 'No device'}
            </span>
            <span className="text-[14px] font-semibold text-[var(--color-text-secondary)]">{stateLabel}</span>
          </div>

          <button
            type="button"
            aria-label="Refresh devices"
            onClick={refreshDevices}
            disabled={refreshing}
            className={iconButtonClass}
          >
            <RotateCw size={18} stroke={1.75} className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined} />
          </button>

          {isShell && (
            <>
              <button
                type="button"
                aria-label="Command history"
                onClick={() => setShowHistory(!showHistory)}
                className={cn(iconButtonClass, showHistory && 'bg-[var(--color-background-card)] text-[var(--color-text-primary)]')}
              >
                <History size={18} stroke={1.75} />
              </button>
              <button
                type="button"
                aria-label="Clear output"
                onClick={clearOutput}
                disabled={!session}
                className={iconButtonClass}
              >
                <Trash2 size={18} stroke={1.75} />
              </button>
              {connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex h-11 items-center rounded-full bg-[var(--color-error)] px-6 text-[15px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
                >
                  Disconnect
                </button>
              ) : (
                <Button
                  label={connecting ? 'Connecting…' : 'Connect'}
                  variant="primary"
                  className="h-11 rounded-full px-6 text-[15px] font-bold"
                  onClick={handleConnect}
                  isDisabled={connecting || !canConnect(mode)}
                />
              )}
            </>
          )}
      </motion.div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
            transition={{ duration: reduced ? 0.12 : 0.25, ease: EASE }}
            className="m3-surface flex h-full min-h-0 flex-col overflow-hidden rounded-3xl"
          >
            {isShell ? (
              <>
                <TerminalView
                  className="min-h-0 flex-1"
                  output={output}
                  onResize={handleResize}
                />

                {error && (
                  <div className="border-t border-border/40 bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-5 py-3 text-[14px] font-medium text-[var(--color-error)]">
                    {error}
                  </div>
                )}
                {!canConnect(mode) && !error && !connected && (
                  <div className="border-t border-border/40 bg-[var(--color-surface-inset)] px-5 py-3 text-[14px] text-[var(--color-text-secondary)]">
                    {mode === 'fastboot-host'
                      ? 'No Fastboot device detected. Connect a device in Fastboot mode first.'
                      : 'No device selected. Select a device first.'}
                  </div>
                )}

                <form
                  className="flex items-center gap-3 border-t border-border/40 bg-[var(--color-surface-inset)] px-4 py-3"
                  onSubmit={handleSubmitCommand}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background-card)] font-mono text-[14px] font-bold text-[var(--color-accent)] select-none">
                    $
                  </span>
                  <input
                    value={command}
                    onChange={(event) => setCommand(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={placeholderText(mode, connected)}
                    aria-label="Terminal command"
                    className="h-12 min-w-0 flex-1 rounded-full bg-[var(--color-background-card)] px-5 font-mono text-[14px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                    disabled={!connected || !session}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    disabled={!connected || !session || command.trim() === ''}
                    className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-[16px] font-bold text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
                  >
                    <CornerDownLeft size={18} stroke={1.75} />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <LogcatWorkspace />
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {showHistory && isShell && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { x: '100%' }}
              animate={reduced ? { opacity: 1 } : { x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: '100%' }}
              transition={reduced ? { duration: 0.12 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-y-0 right-0 z-40 flex w-[360px] flex-col overflow-hidden rounded-r-3xl border-l border-border/40 bg-[var(--color-surface-container)]"
            >
              <CommandHistory
                onReExecute={handleReExecuteCommand}
                onClose={() => setShowHistory(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}