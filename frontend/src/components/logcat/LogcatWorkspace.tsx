import { ArrowDownToLine, Trash2, Play, FileDown, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Kbd } from '@/components/ui/kbd'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogcatStore } from '@/stores/useLogcatStore'
import { useLogcat } from '@/hooks/useLogcat'
import { LogcatView } from '@/components/logcat/LogcatView'
import { LogcatFilters } from '@/components/logcat/LogcatFilters'
import { cn } from '@/lib/utils'

const isMac = navigator.platform.toUpperCase().includes('MAC')
const modKey = isMac ? '\u2318' : 'Ctrl'

interface LogcatWorkspaceProps {
  embedded?: boolean
}

export function LogcatWorkspace({ embedded = false }: LogcatWorkspaceProps) {
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

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isStreaming ? (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse shrink-0" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {isStreaming
              ? streamingSerial
              : streamingSerial
                ? `${streamingSerial} · stopped`
                : activeSerial
                  ? activeSerial
                  : 'No device'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                disabled={logCount === 0}
              >
                <FileDown className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsText} className="text-xs">
                <ArrowDownToLine className="mr-2 h-3.5 w-3.5" />
                Export as TXT
                <Kbd className="ml-auto">{modKey}+E</Kbd>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsJson} className="text-xs">
                <FileJson className="mr-2 h-3.5 w-3.5" />
                Export as JSON
                <Kbd className="ml-auto">{modKey}+Shift+E</Kbd>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            disabled={logCount === 0}
            title={`Clear (${modKey}+K)`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <div className="h-3.5 w-px bg-border/50 mx-0.5" />

          {isStreaming ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs px-3"
              onClick={handleStop}
            >
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs px-3 gap-1.5"
              onClick={handleStart}
              disabled={!activeSerial}
            >
              <Play className="h-3 w-3" />
              Start
            </Button>
          )}
        </div>
      </div>

      <LogcatFilters />

      <div className="flex-1 min-h-0 relative bg-[var(--terminal-bg)]">
        <div ref={scrollContainerRef} className="h-full overflow-auto">
          <LogcatView scrollContainerRef={scrollContainerRef} />
        </div>

        {showScrollButton && (
          <Button
            size="icon"
            className="absolute bottom-4 right-4 h-7 w-7 rounded-full shadow-[var(--shadow-raised)]"
            onClick={scrollToBottom}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/40 bg-background px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Switch
            checked={autoScroll}
            onCheckedChange={setAutoScroll}
            className="scale-75 origin-left"
          />
          <span className="text-xs text-muted-foreground">Auto-scroll</span>
        </div>
        <div className="flex items-center gap-2">
          {bufferFull && (
            <span className="text-[10px] text-[var(--warning)]">
              Buffer full
            </span>
          )}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1000}
              max={500000}
              step={1000}
              value={bufferLimit}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 1000) {
                  setBufferLimit(val)
                }
              }}
              className="h-5 w-20 rounded border border-border/40 bg-muted/30 px-1.5 text-[10px] tabular-nums text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/20"
            />
            <span className="text-[10px] text-muted-foreground tabular-nums">
              / {logCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-3 py-1.5 border-t border-border/40 text-xs text-destructive">
          {error}
        </div>
      )}
      {!activeSerial && !isStreaming && (
        <div
          className={cn(
            'px-3 py-1.5 border-t border-border/40 text-xs text-muted-foreground',
            embedded && 'hidden',
          )}
        >
          No device selected. Select a device first to start logcat.
        </div>
      )}
    </div>
  )
}
