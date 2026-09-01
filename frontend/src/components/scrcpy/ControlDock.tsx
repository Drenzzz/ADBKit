import {
  IconCamera as Camera,
  IconCircle as Circle,
  IconSquare as Square
} from "@tabler/icons-react"
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

interface ControlDockProps {
  className?: string
  isConnected: boolean
  isRecording: boolean
  onScreenshot: () => void
  onToggleRecord: () => void
  onStopSession: () => void
}

function TooltipIconButton({
  label,
  onClick,
  disabled,
  ariaLabel,
  children,
  variant = 'ghost',
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  children: React.ReactNode
  variant?: 'ghost' | 'destructive'
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            size="icon"
            variant="ghost"
            className={`h-8 w-8 rounded-full transition-[colors,transform] active:scale-[0.93] cursor-pointer flex items-center justify-center ${
              variant === 'destructive'
                ? 'bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 text-white shadow-sm'
                : 'text-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground hover:bg-[var(--muted)]/60 dark:hover:bg-[var(--muted)]/60'
            }`}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
          >
            {children}
          </Button>
        )}
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ControlDock({
  className,
  isConnected,
  isRecording,
  onScreenshot,
  onToggleRecord,
  onStopSession,
}: ControlDockProps) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-[var(--border)]/50 dark:border-[var(--border)]/50 bg-card/70 dark:bg-[var(--muted)]/70 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-colors duration-300 ${
        className ?? ''
      }`}
    >
      <TooltipIconButton
        label="Screenshot"
        ariaLabel="Take screenshot"
        onClick={onScreenshot}
        disabled={!isConnected}
      >
        <Camera className="h-4 w-4" />
      </TooltipIconButton>

      <TooltipIconButton
        label={isRecording ? 'Stop recording' : 'Start recording'}
        ariaLabel={isRecording ? 'Stop recording' : 'Start recording'}
        onClick={onToggleRecord}
        disabled={!isConnected}
        variant={isRecording ? 'destructive' : 'ghost'}
      >
        {isRecording ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Circle className="h-3.5 w-3.5 fill-current text-[var(--destructive)]" />
        )}
      </TooltipIconButton>

      <Separator orientation="vertical" className="mx-1 h-6 bg-[var(--border)] dark:bg-[var(--border)]" />

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              size="sm"
              variant="destructive"
              className="h-8 rounded-full px-4 text-xs font-semibold bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 text-white border-0 shadow-sm active:scale-95 transition-[colors,transform] cursor-pointer"
              onClick={onStopSession}
              disabled={!isConnected}
            >
              Stop session
            </Button>
          )}
        />
        <TooltipContent>Close the scrcpy window and end the session</TooltipContent>
      </Tooltip>
    </div>
  )
}
