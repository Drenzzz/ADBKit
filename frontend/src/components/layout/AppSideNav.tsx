import { useLocation, useNavigate } from 'react-router-dom'
import {
  IconLayoutDashboard as LayoutDashboard,
  IconDeviceMobile as Smartphone,
  IconBox as Package,
  IconFolderOpen as FolderOpen,
  IconBolt as Zap,
  IconTerminal as Terminal,
  IconCast as MonitorPlay,
  IconSettings as Settings,
  IconSun as Sun,
  IconMoon as Moon,
  IconCheck as Check,
  IconBolt as ModeZap,
  IconHelp as HelpCircle,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { useUIStore } from '@/stores/useUIStore'
import { useSettings } from '@/hooks/useSettings'
import type { DeviceMode } from '@/lib/types'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/devices', label: 'Devices', icon: Smartphone },
  { to: '/apps', label: 'Apps', icon: Package },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/flasher', label: 'Flasher', icon: Zap },
  { to: '/terminal', label: 'Terminal', icon: Terminal },
  { to: '/scrcpy', label: 'Scrcpy', icon: MonitorPlay },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const MODE_CONFIG: Record<
  DeviceMode,
  { label: string; icon: typeof Smartphone; tone: string }
> = {
  adb: { label: 'ADB', icon: Smartphone, tone: 'text-[var(--color-success)]' },
  fastboot: { label: 'Fastboot', icon: ModeZap, tone: 'text-[var(--color-warning)]' },
  unknown: { label: 'No device', icon: HelpCircle, tone: 'text-[var(--color-text-secondary)]' },
}

// Labeled rail: the permanent label replaces the old hover tooltip, which
// WebKitGTK clipped anyway. Active state is a tonal pill around the icon only.
function RailButton({
  label,
  ariaLabel,
  onClick,
  children,
  active,
  tone,
}: {
  label: string
  ariaLabel?: string
  onClick?: () => void
  children: React.ReactNode
  active?: boolean
  tone?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-current={active ? 'page' : undefined}
      className="flex w-full flex-col items-center gap-1.5 rounded-2xl py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-150 motion-reduce:transition-none',
          active
            ? 'bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]'
            : cn('text-[var(--color-text-secondary)] hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-text-primary)]', tone),
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          'w-full truncate px-1 text-center text-[14px] transition-colors duration-150 motion-reduce:transition-none',
          active
            ? 'font-semibold text-[var(--color-text-primary)]'
            : 'font-medium text-[var(--color-text-secondary)]',
        )}
      >
        {label}
      </span>
    </button>
  )
}

function DeviceStatus() {
  const { devices, activeSerial, selectDevice, deviceMode } = useDevices()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  const mode = MODE_CONFIG[deviceMode ?? 'unknown']
  const ModeIcon = mode.icon
  const activeDevice = devices.find((d) => d.serial === activeSerial)
  const deviceLabel = activeDevice
    ? activeDevice.model || activeDevice.product || activeDevice.serial
    : 'Select device'

  return (
    <div className="relative flex w-full flex-col items-center gap-2" ref={ref}>
      {devices.length > 0 && (
        <div className="relative flex w-full justify-center">
          <RailButton
            label={deviceLabel}
            ariaLabel={`Device: ${deviceLabel}`}
            onClick={() => setOpen((v) => !v)}
          >
            <Smartphone size={22} stroke={1.75} />
          </RailButton>

          {open && (
            <div className="absolute left-full top-0 z-50 ml-2 w-56 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-[var(--shadow-floating)]">
              {devices.map((device) => (
                <button
                  key={device.serial}
                  onClick={() => handleSelect(device.serial)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-[14px] transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {device.model || device.product || device.serial}
                    </span>
                    <span className="truncate font-mono text-[13px] text-muted-foreground">{device.serial}</span>
                  </div>
                  {device.serial === activeSerial && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode is derived from the device state, not a control: render as status. */}
      <div
        role="status"
        aria-label={`Mode: ${mode.label}`}
        className="flex w-full flex-col items-center gap-1.5 py-1"
      >
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', mode.tone)}>
          <ModeIcon size={22} stroke={1.75} />
        </span>
        <span className="w-full truncate px-1 text-center text-[14px] font-medium text-[var(--color-text-secondary)]">
          {mode.label}
        </span>
      </div>
    </div>
  )
}

function ThemeSwitcher() {
  const { theme, setTheme: setLocalTheme } = useUIStore()
  const { appConfig, setTheme: persistTheme } = useSettings()

  useEffect(() => {
    if (!appConfig) return
    const next = appConfig.theme === 'light' ? 'light' : 'dark'
    if (next !== theme) setLocalTheme(next)
  }, [appConfig, theme, setLocalTheme])

  function handleToggleTheme() {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark'
    setLocalTheme(next)
    void persistTheme(next)
  }

  const target = theme === 'dark' ? 'Light' : 'Dark'
  return (
    <RailButton
      label={target}
      ariaLabel={`Switch to ${target.toLowerCase()} mode`}
      onClick={handleToggleTheme}
    >
      {theme === 'dark' ? <Sun size={22} stroke={1.75} /> : <Moon size={22} stroke={1.75} />}
    </RailButton>
  )
}

export function AppSideNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className="flex w-24 shrink-0 flex-col items-center gap-4 py-3"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-inset)]">
        <img src="/logo.webp" alt="ADBKit" className="h-8 w-8 object-contain" />
      </div>

      <nav
        className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto pt-2"
        aria-label="Sections"
      >
        {NAV_ITEMS.map((item) => {
          const isSelected =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)

          return (
            <RailButton
              key={item.to}
              label={item.label}
              active={isSelected}
              onClick={() => navigate(item.to)}
            >
              <item.icon size={22} stroke={1.75} />
            </RailButton>
          )
        })}
      </nav>

      <div className="flex w-full flex-col items-center gap-2">
        <DeviceStatus />
        <ThemeSwitcher />
      </div>
    </aside>
  )
}