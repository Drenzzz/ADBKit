import { useState, useRef, useEffect } from 'react'
import {
  IconDeviceMobile as Smartphone,
  IconBolt as Zap,
  IconHelp as HelpCircle,
  IconCheck as Check,
  IconSun as Sun,
  IconMoon as Moon,
} from '@tabler/icons-react'
import { useDevices } from '@/hooks/useDevices'
import { useUIStore } from '@/stores/useUIStore'
import { useSettings } from '@/hooks/useSettings'
import type { DeviceMode } from '@/lib/types'

const MODE_CONFIG: Record<
  DeviceMode,
  { label: string; icon: typeof Smartphone; tone: string }
> = {
  adb: { label: 'ADB', icon: Smartphone, tone: 'text-success' },
  fastboot: { label: 'Fastboot', icon: Zap, tone: 'text-warning' },
  unknown: { label: 'No device', icon: HelpCircle, tone: 'text-muted-foreground' },
}

export function AppSideNavFooter() {
  const { devices, activeSerial, selectDevice, deviceMode } = useDevices()
  const { theme, setTheme: setLocalTheme } = useUIStore()
  const { appConfig, setTheme: persistTheme } = useSettings()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!appConfig) return
    const next = appConfig.theme === 'light' ? 'light' : 'dark'
    if (next !== theme) setLocalTheme(next)
  }, [appConfig, theme, setLocalTheme])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleSelect(serial: string) {
    await selectDevice(serial)
    setOpen(false)
  }

  function handleToggleTheme() {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark'
    setLocalTheme(next)
    void persistTheme(next)
  }

  const mode = MODE_CONFIG[deviceMode ?? 'unknown']
  const ModeIcon = mode.icon
  const activeDevice = devices.find((d) => d.serial === activeSerial)
  const deviceLabel = activeDevice
    ? activeDevice.model || activeDevice.product || activeDevice.serial
    : 'Select device'

  return (
    <div className="flex flex-col items-center gap-2" ref={ref}>
      {devices.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Device: ${deviceLabel}`}
          title={deviceLabel}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Smartphone className="h-4.5 w-4.5" />
        </button>
      )}

      {open && (
        <div className="absolute left-full top-0 z-50 ml-2 w-56 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-[var(--shadow-floating)]">
          {devices.map((device) => (
            <button
              key={device.serial}
              onClick={() => handleSelect(device.serial)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-accent/50"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">
                  {device.model || device.product || device.serial}
                </span>
                <span className="truncate text-muted-foreground">{device.serial}</span>
              </div>
              {device.serial === activeSerial && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode.tone}`}
        title={mode.label}
        aria-label={`Device mode: ${mode.label}`}
      >
        <ModeIcon className="h-4.5 w-4.5" />
      </span>

      <button
        type="button"
        onClick={handleToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
      </button>
    </div>
  )
}
