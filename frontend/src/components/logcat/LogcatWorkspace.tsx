import {
  IconArrowBarToDown as ArrowDownToLine,
  IconTrash as Trash2,
  IconPlayerPlay as Play,
  IconFileDownload as FileDown,
  IconBraces as FileJson
} from "@tabler/icons-react"
import { Switch } from '@astryxdesign/core/Switch'
import { useLogcatStore } from '@/stores/useLogcatStore'
import { useLogcat } from '@/hooks/useLogcat'
import { LogcatView } from '@/components/logcat/LogcatView'
import { LogcatFilters } from '@/components/logcat/LogcatFilters'
import { cn } from '@/lib/utils'

const isMac = navigator.platform.toUpperCase().includes('MAC')
const modKey = isMac ? '⌘' : 'Ctrl'

export function LogcatWorkspace() {
  const {
    streamingSerial,
    isStreaming,
    activeSerial,
    showScrollButton,
    scrollContainerRef,
    handleStart,
    handleStop,
    handleClear,
    exportAsText,
    exportAsJson,
    scrollToBottom,
  } = useLogcat()

  const autoScroll = useLogcatStore((state) => state.autoScroll)
  const setAutoScroll = useLogcatStore((state) => state.setAutoScroll)
  const error = useLogcatStore((state) => state.error)
  const logCount = useLogcatStore((state) => state.logs.length)
  const bufferFull = useLogcatStore((state) => state.bufferFull)
  const bufferLimit = useLogcatStore((state) => state.bufferLimit)
  const setBufferLimit = useLogcatStore((state) => state.setBufferLimit)

  const bufferRatio = Math.min(1, logCount / bufferLimit)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 lg:flex-row lg:overflow-visible">
      <div className="flex min-h-[320px] min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className={cn(
                'h-2.5 w-2.5 shrink-0 rounded-full',
                isStreaming
                  ? 'bg-[var(--color-success)]'
                  : 'bg-[var(--color-text-secondary)]/40',
              )}
            />
            <span className="truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
              {isStreaming
                ? streamingSerial
                : streamingSerial
                  ? `${streamingSerial} (stopped)`
                  : activeSerial
                    ? activeSerial
                    : 'No device'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Clear logs"
              onClick={handleClear}
              disabled={logCount === 0}
              className="flex size-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
            >
              <Trash2 size={18} stroke={1.75} />
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="flex h-10 items-center gap-2 rounded-full bg-[var(--color-error)] px-5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                disabled={!activeSerial}
                className="flex h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
              >
                <Play size={16} stroke={1.75} />
                Start
              </button>
            )}
          </div>
        </div>

        {!activeSerial && !isStreaming && (
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            No device selected. Select a device first to start logcat.
          </p>
        )}

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[var(--color-surface-inset)]">
          <div ref={scrollContainerRef} className="h-full overflow-auto">
            <LogcatView scrollContainerRef={scrollContainerRef} />
          </div>

          {showScrollButton && (
            <button
              type="button"
              aria-label="Scroll to latest logs"
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-[var(--color-background-card)] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              <ArrowDownToLine size={18} stroke={1.75} />
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-4 py-3 text-[14px] font-medium text-[var(--color-error)]">
            {error}
          </p>
        )}
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-5 rounded-2xl bg-[var(--color-surface-inset)] p-4 lg:w-[280px] lg:overflow-y-auto">
        <LogcatFilters />

        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-[var(--color-text-secondary)]">Export</p>
          <button
            type="button"
            onClick={exportAsText}
            disabled={logCount === 0}
            className="flex h-11 items-center gap-3 rounded-xl bg-[var(--color-background-card)] px-3 text-[15px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
          >
            <FileDown size={18} stroke={1.75} className="shrink-0 text-[var(--color-text-secondary)]" />
            <span className="flex-1 text-left">Export as TXT</span>
            <span className="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded-md border border-border/50 bg-[var(--color-surface-inset)] px-1.5 font-mono text-[13px] text-[var(--color-text-secondary)]">{modKey}+E</span>
          </button>
          <button
            type="button"
            onClick={exportAsJson}
            disabled={logCount === 0}
            className="flex h-11 items-center gap-3 rounded-xl bg-[var(--color-background-card)] px-3 text-[15px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
          >
            <FileJson size={18} stroke={1.75} className="shrink-0 text-[var(--color-text-secondary)]" />
            <span className="flex-1 text-left">Export as JSON</span>
            <span className="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded-md border border-border/50 bg-[var(--color-surface-inset)] px-1.5 font-mono text-[13px] text-[var(--color-text-secondary)]">{modKey}+Shift+E</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-[var(--color-text-secondary)]">Buffer</p>
            {bufferFull && (
              <span className="text-[14px] font-semibold text-[var(--color-warning)]">Full</span>
            )}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--color-background-card)]">
            <div
              className={cn(
                'h-full origin-left rounded-full transition-transform duration-300 motion-reduce:transition-none',
                bufferFull ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-accent)]',
              )}
              style={{ transform: `scaleX(${bufferRatio})` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1000}
              max={500000}
              step={1000}
              value={bufferLimit}
              aria-label="Buffer limit"
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 1000) {
                  setBufferLimit(val)
                }
              }}
              className="h-9 w-24 rounded-full bg-[var(--color-background-card)] px-3 text-[14px] text-[var(--color-text-primary)] tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            />
            <span className="text-[14px] text-[var(--color-text-secondary)] tabular-nums">
              / {logCount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="cursor-pointer text-[15px] font-medium text-[var(--color-text-primary)]">
            Auto-scroll
          </p>
          <Switch
            label="Auto-scroll"
            isLabelHidden
            value={autoScroll}
            onChange={setAutoScroll}
          />
        </div>
      </aside>
    </div>
  )
}