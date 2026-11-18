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
  adb: { label: 'ADB', icon: Smartphone, tone: 'text-success' },
  fastboot: { label: 'Fastboot', icon: ModeZap, tone: 'text-warning' },
  unknown: { label: 'No device', icon: HelpCircle, tone: 'text-muted-foreground' },
}

// Rail tooltip: pure CSS, anchored to the right of the 56px rail. Astryx's
// tooltip relies on CSS position-area, which WebKitGTK does not fully
// support, so labels there render clipped inside the rail's overflow.
function RailButton({
  label,
  onClick,
  children,
  active,
  tone,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
  active?: boolean
  tone?: string
}) {
  return (
    <div className="group/rail relative flex w-full justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
          active
            ? 'bg-accent text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          tone,
        )}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1 text-base font-medium text-popover-foreground opacity-0 shadow-[var(--shadow-card)] transition-opacity duration-150 delay-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100"
      >
        {label}
      </span>
    </div>
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
    <div className="relative flex w-full flex-col items-center gap-3" ref={ref}>
      {devices.length > 0 && (
        <div className="group/rail relative flex w-full justify-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={`Device: ${deviceLabel}`}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Smartphone className="h-8 w-8" />
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1 text-sm font-medium text-popover-foreground opacity-0 shadow-[var(--shadow-card)] transition-opacity duration-150 delay-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100"
          >
            {deviceLabel}
          </span>

          {open && (
            <div className="absolute left-full top-0 z-50 ml-2 w-56 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-[var(--shadow-floating)]">
              {devices.map((device) => (
                <button
                  key={device.serial}
                  onClick={() => handleSelect(device.serial)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-accent/50"
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
        </div>
      )}

      <RailButton label={`Mode: ${mode.label}`} tone={mode.tone}>
        <ModeIcon className="h-8 w-8" />
      </RailButton>
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

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <RailButton label={label} onClick={handleToggleTheme}>
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
      className="flex w-14 shrink-0 flex-col items-center py-3"
    >
      <img src="/logo.webp" alt="ADBKit" className="h-8 w-8 object-contain" />

      {/* Menu list, centered in the remaining space */}
      <nav
        className="flex w-full flex-1 flex-col items-center justify-center gap-3"
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
              <item.icon className="h-8 w-8" />
            </RailButton>
          )
        })}
      </nav>

      {/* Bottom block: device status, then theme switcher */}
      <div className="flex w-full flex-col items-center gap-3">
        <DeviceStatus />
        <ThemeSwitcher />
      </div>
    </aside>
  )
}
