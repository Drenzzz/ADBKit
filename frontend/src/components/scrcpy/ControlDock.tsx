import { Camera, Circle, Square } from 'lucide-react'
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
            className={`h-8 w-8 rounded-full transition-all active:scale-[0.93] cursor-pointer flex items-center justify-center ${
              variant === 'destructive'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
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
      className={`flex items-center gap-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 ${
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
          <Circle className="h-3.5 w-3.5 fill-current text-rose-500" />
        )}
      </TooltipIconButton>

      <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-200 dark:bg-zinc-800" />

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              size="sm"
              variant="destructive"
              className="h-8 rounded-full px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border-0 shadow-sm active:scale-95 transition-all cursor-pointer"
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
