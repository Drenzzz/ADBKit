import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useFlasher } from '@/hooks/useFlasher'
import { Power, PlayCircle, Cpu, Unlock, BatteryCharging, Info } from 'lucide-react'

interface WakeOnFastbootCardProps {
  disabled?: boolean
}

/**
 * WOF (Wake on Fastboot) card.
 *
 * Software replacements for a broken physical power button:
 *  - Stay Awake While Charging: never sleep on USB, so a screen-off device
 *    stays reachable (best daily workaround for a dead power button).
 *  - Wake + Unlock: KEYCODE_WAKEUP + keyguard dismiss (one-tap turn-on).
 *  - Continue Boot: `fastboot continue` — exits fastboot without a Start press.
 */
export function WakeOnFastbootCard({ disabled }: WakeOnFastbootCardProps) {
  const {
    activeFastbootSerial,
    deviceMode,
    continueBoot,
    wakeAndUnlock,
    setStayAwake,
    getStayAwake,
  } = useFlasher()

  const [stayAwake, setStayAwakeState] = useState(false)
  const [toggling, setToggling] = useState(false)

  const hasDevice = !!activeFastbootSerial && !disabled
  const isFastboot = deviceMode === 'fastboot' || deviceMode === 'fastbootd'
  const isAdb = hasDevice && !isFastboot

  // Sync the toggle with the device's current setting when an ADB device
  // becomes active. Stay-awake is an Android setting, unavailable in fastboot.
  useEffect(() => {
    if (!isAdb) return
    let cancelled = false
    getStayAwake().then((enabled) => {
      if (!cancelled) setStayAwakeState(enabled)
    })
    return () => {
      cancelled = true
    }
  }, [isAdb, activeFastbootSerial, getStayAwake])

  const handleToggle = async (next: boolean) => {
    setToggling(true)
    setStayAwakeState(next) // optimistic
    try {
      await setStayAwake(next)
    } catch {
      setStayAwakeState(!next) // revert on failure
    } finally {
      setToggling(false)
    }
  }

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
          Power-button replacement. Keep the screen on while charging, wake it on
          demand, or boot out of fastboot — all from software.
        </p>

        {/* Stay awake while charging: the core daily workaround */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/40 dark:bg-[var(--muted)]/20 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <BatteryCharging className="h-4 w-4 mt-0.5 text-[var(--primary)] shrink-0" />
            <div className="space-y-0.5">
              <Label
                htmlFor="wof-stay-awake"
                className="text-xs font-semibold cursor-pointer"
              >
                Stay awake while charging
              </Label>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Screen never sleeps on any charger. Requires ADB mode.
              </p>
            </div>
          </div>
          <Switch
            id="wof-stay-awake"
            checked={stayAwake}
            onCheckedChange={handleToggle}
            disabled={!isAdb || toggling}
          />
        </div>

        <div className="space-y-2">
          <Button
            className="w-full rounded-full text-xs font-semibold h-9 transition-[colors,transform] active:scale-[0.97] cursor-pointer"
            onClick={wakeAndUnlock}
            disabled={!isAdb}
          >
            <Unlock className="mr-1.5 h-3.5 w-3.5" />
            Wake + Unlock (turn on)
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-full text-xs font-semibold h-9 transition-[colors,transform] active:scale-[0.97] cursor-pointer"
            onClick={continueBoot}
            disabled={!hasDevice || !isFastboot}
          >
            <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
            Continue Boot (exit fastboot)
          </Button>
        </div>

        {/* Dead-battery + dead-button rescue path */}
        <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/30 dark:bg-[var(--muted)]/15 px-3 py-2.5">
          <Info className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-tight">
            <span className="font-semibold text-foreground/80">Phone fully off?</span>{' '}
            No software can boot a powered-off device. Try your model's bootloader
            combo (often Vol Down while plugging USB) to reach fastboot, then hit
            Continue Boot. Keep &ldquo;Stay awake&rdquo; on to avoid this.
          </p>
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
