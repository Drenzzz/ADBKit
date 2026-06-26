import type { ScrcpySessionStatus, ScrcpyOptions } from '@/lib/types'
import { Loader2, AlertTriangle, MonitorPlay } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface VideoContainerProps {
  sessionStatus: ScrcpySessionStatus
  error: string | null
  isStarting: boolean
  options?: ScrcpyOptions
}

export function VideoContainer({
  sessionStatus,
  error,
  isStarting,
  options,
}: VideoContainerProps) {
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-2xl border-[var(--destructive)]/20 bg-[var(--destructive)]/10 dark:bg-[var(--destructive)]/20">
          <AlertTriangle className="h-4 w-4 text-[var(--destructive)] dark:text-[var(--destructive)]" />
          <AlertTitle className="text-[var(--destructive)] dark:text-[var(--destructive)] font-bold">Mirror session error</AlertTitle>
          <AlertDescription className="text-xs text-[var(--destructive)] dark:text-[var(--destructive)] mt-1">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isStarting || sessionStatus === 'starting') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">Starting scrcpy window...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="relative flex max-w-sm w-full flex-col items-center gap-4 rounded-3xl border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/20 p-6 text-center shadow-[var(--shadow-card)]">
        
        {/* Pulsing signal indicators */}
        <div className="relative mb-1 flex h-16 w-16 items-center justify-center">
          {/* Wave ring 1 */}
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/10 opacity-75" />
          {/* Wave ring 2 */}
          <span className="absolute inline-flex h-12 w-12 animate-pulse rounded-full bg-primary/10 opacity-50" />
          
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <MonitorPlay className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xs font-bold text-foreground">Mirror Session Active</h2>
          <p className="text-[10px] text-muted-foreground dark:text-muted-foreground leading-relaxed font-medium">
            Scrcpy is rendering in its native window. Use the floating control dock below to manage the stream.
          </p>
        </div>

        {options && (
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-[var(--border)] dark:border-[var(--border)]/80 bg-[var(--muted)]/50 dark:bg-[var(--muted)]/40 px-3 py-1 text-[9px] font-bold text-muted-foreground dark:text-muted-foreground font-mono">
            <span>{options.video_codec?.toUpperCase() || 'H264'}</span>
            <span className="text-muted-foreground/30 dark:text-muted-foreground/30">|</span>
            <span>
              {options.max_size === 0 ? 'Max Res' : `${options.max_size}px`}
            </span>
            <span className="text-muted-foreground/30 dark:text-muted-foreground/30">|</span>
            <span>
              {((options.bit_rate || 8000000) / 1000000).toFixed(1)} Mbps
            </span>
            {options.max_fps > 0 && (
              <>
                <span className="text-muted-foreground/30 dark:text-muted-foreground/30">|</span>
                <span>{options.max_fps} FPS</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
