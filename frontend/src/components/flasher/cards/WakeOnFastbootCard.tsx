import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFlasher } from '@/hooks/useFlasher'
import { Power, PlayCircle, Cpu } from 'lucide-react'

interface WakeOnFastbootCardProps {
  disabled?: boolean
}

/**
 * WOF (Wake on Fastboot) card.
 *
 * Software replacements for a broken physical power button:
 *  - Continue Boot: `fastboot continue` — exits fastboot/bootloader into the OS
 *    without pressing the on-device Start button.
 *  - Wake Screen: `adb shell input keyevent KEYCODE_WAKEUP` — turns the screen on.
 */
export function WakeOnFastbootCard({ disabled }: WakeOnFastbootCardProps) {
  const { activeFastbootSerial, deviceMode, continueBoot, wakeScreen } = useFlasher()

  const hasDevice = !!activeFastbootSerial && !disabled
  const isFastboot = deviceMode === 'fastboot' || deviceMode === 'fastbootd'

  return (
    <Card className="relative overflow-hidden border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-surface)] rounded-2xl shadow-[var(--shadow-card)] h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Power className="h-4 w-4 text-[var(--primary)]" />
          Wake on Fastboot (WOF)
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed font-medium">
          Power-button replacement. Boot the device out of fastboot or wake its
          screen entirely from software — no physical button press needed.
        </p>

        <div className="space-y-2 mt-4">
          <Button
            className="w-full rounded-full text-xs font-semibold h-9 transition-[colors,transform] active:scale-[0.97] cursor-pointer"
            onClick={continueBoot}
            disabled={!hasDevice || !isFastboot}
          >
            <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
            Continue Boot (exit fastboot)
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-full text-xs font-semibold h-9 transition-[colors,transform] active:scale-[0.97] cursor-pointer"
            onClick={wakeScreen}
            disabled={!hasDevice}
          >
            <Power className="mr-1.5 h-3.5 w-3.5" />
            Wake Screen (KEYCODE_WAKEUP)
          </Button>
        </div>
      </CardContent>

      {disabled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/80 dark:bg-[var(--terminal-surface)]/85 backdrop-blur-[3px] select-none transition-colors duration-300">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/90 px-3 py-1.5 shadow-sm text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
            Device Required
          </div>
        </div>
      )}
    </Card>
  )
}
