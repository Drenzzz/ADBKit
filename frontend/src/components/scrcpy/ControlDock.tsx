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
            variant={variant}
            className="h-9 w-9 rounded-full"
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
      className={`flex items-center gap-1 rounded-full border border-border/60 bg-background/95 p-1 shadow-lg backdrop-blur ${
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
          <Square className="h-4 w-4 fill-current" />
        ) : (
          <Circle className="h-4 w-4 fill-current text-red-500" />
        )}
      </TooltipIconButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              size="sm"
              variant="destructive"
              className="h-9 rounded-full px-4"
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
