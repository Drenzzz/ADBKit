import { useEffect, useState } from 'react'
import { useFlasher } from '@/hooks/useFlasher'
import { Switch } from '@/components/ui/switch'
import {
  IconInfoCircle,
  IconLockOpen,
  IconBatteryCharging,
  IconPlayerPlay,
} from "@tabler/icons-react"

interface WakeOnFastbootCardProps {
  disabled?: boolean
}

/**
 * WOF (Wake on Fastboot): software replacements for a broken physical power
 * button. Stay Awake keeps a screen-off device reachable on USB; Wake +
 * Unlock turns the screen on; Continue Boot exits fastboot without Start.
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
    setStayAwakeState(next)
    try {
      await setStayAwake(next)
    } catch {
      setStayAwakeState(!next)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-6">
        <h3 className="text-[32px] font-semibold tracking-tight text-[var(--color-text-primary)]">Power & Wake</h3>
        <p className="mt-1 text-[16px] text-[var(--color-text-secondary)]">
          Power-button replacements, all from software
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-surface-inset)] px-5 py-5">
          <div className="flex items-start gap-3.5">
            <IconBatteryCharging size={20} stroke={1.75} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
            <div>
              <label
                htmlFor="wof-stay-awake"
                className="cursor-pointer text-[16px] font-semibold text-[var(--color-text-primary)]"
              >
                Stay awake while charging
              </label>
              <p className="mt-0.5 text-[15px] text-[var(--color-text-secondary)]">
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

        <button
          type="button"
          onClick={wakeAndUnlock}
          disabled={!isAdb}
          className="flex w-full items-center gap-4 rounded-2xl bg-[var(--color-surface-inset)] px-5 py-5 text-left transition-colors hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background-card)] text-[var(--color-accent)]">
            <IconLockOpen size={20} stroke={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block whitespace-nowrap text-[16px] font-semibold text-[var(--color-text-primary)]">Wake + Open</span>
            <span className="block text-[15px] text-[var(--color-text-secondary)]">Turn the screen on and dismiss the keyguard. Requires ADB mode.</span>
          </span>
        </button>

        <button
          type="button"
          onClick={continueBoot}
          disabled={!hasDevice || !isFastboot}
          className="flex w-full items-center gap-4 rounded-2xl bg-[var(--color-surface-inset)] px-5 py-5 text-left transition-colors hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background-card)] text-[var(--color-accent)]">
            <IconPlayerPlay size={20} stroke={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block whitespace-nowrap text-[16px] font-semibold text-[var(--color-text-primary)]">Continue Boot</span>
            <span className="block text-[15px] text-[var(--color-text-secondary)]">Exit fastboot and boot the system without pressing Start.</span>
          </span>
        </button>

        <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-surface-inset)] px-5 py-4">
          <IconInfoCircle size={20} stroke={1.75} className="mt-0.5 shrink-0 text-[var(--color-text-secondary)]" />
          <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)]">Phone fully off?</span>{' '}
            No software can boot a powered-off device. Try your model's bootloader combo
            (often Vol Down while plugging USB) to reach fastboot, then hit Continue Boot.
            Keep "Stay awake" on to avoid this.
          </p>
        </div>
      </div>
    </div>
  )
}