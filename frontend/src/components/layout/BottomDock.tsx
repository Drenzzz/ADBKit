import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  LayoutDashboard,
  Smartphone,
  Package,
  FolderOpen,
  Zap,
  Terminal,
  MonitorPlay,
  Settings,
  Sun,
  Moon,
} from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useSettings } from '@/hooks/useSettings'
import { DeviceModeBadge } from '@/components/devices/DeviceModeBadge'
import { ActiveDeviceSelector } from '@/components/devices/ActiveDeviceSelector'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/devices', icon: Smartphone, label: 'Devices' },
  { to: '/apps', icon: Package, label: 'Apps' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/flasher', icon: Zap, label: 'Flasher' },
  { to: '/terminal', icon: Terminal, label: 'Terminal' },
  { to: '/scrcpy', icon: MonitorPlay, label: 'Scrcpy' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const HIDE_DELAY_MS = 300

function applyThemeClass(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function BottomDock() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme: setLocalTheme } = useUIStore()
  const { appConfig, setTheme: persistTheme } = useSettings()

  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync theme with config
  useEffect(() => {
    if (!appConfig) return
    const next = appConfig.theme === 'light' ? 'light' : 'dark'
    if (next !== theme) {
      setLocalTheme(next)
      applyThemeClass(next)
    }
  }, [appConfig, theme, setLocalTheme])

  function handleToggleTheme() {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark'
    setLocalTheme(next)
    applyThemeClass(next)
    void persistTheme(next)
  }



  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  function handleDockMouseEnter() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setIsVisible(true)
  }

  function handleDockMouseLeave() {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, HIDE_DELAY_MS)
  }

  return (
    <>
      {/* Invisible hover trigger area at the bottom */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 h-8"
        onMouseEnter={handleDockMouseEnter}
      />

      {/* Persistent handle — always-visible affordance so nav is discoverable.
          Hidden while the full dock is open. */}
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            type="button"
            aria-label="Open navigation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={reduced ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            onMouseEnter={handleDockMouseEnter}
            onClick={handleDockMouseEnter}
            className={cn(
              'fixed bottom-2 left-1/2 z-40 -translate-x-1/2',
              'flex items-center gap-1.5 rounded-full px-3 py-1',
              'border border-border/50 bg-background/90 dark:bg-zinc-900/90 shadow-md backdrop-blur-sm',
              'text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
            )}
          >
            <span className="h-1 w-8 rounded-full bg-border" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={containerRef}
            role="navigation"
            aria-label="Main navigation"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={reduced ? { duration: 0 } : { duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'fixed bottom-3 left-1/2 z-50 -translate-x-1/2',
              'flex items-center gap-0.5 px-3 py-1.5',
              'rounded-2xl border border-border/50 bg-background/95 dark:bg-zinc-900/95 shadow-lg backdrop-blur-sm',
            )}
            onMouseEnter={handleDockMouseEnter}
            onMouseLeave={handleDockMouseLeave}
          >
            {navItems.map((item) => {
              const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
              const Icon = item.icon

              return (
                <div key={item.to} className="relative flex flex-col items-center group">
                  {/* CSS-only Tooltip (runs on browser thread) */}
                  <div className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-[transform,opacity] duration-150 ease-out whitespace-nowrap">
                    <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-[var(--shadow-card)]">
                      {item.label}
                    </div>
                    <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 border-b border-r border-border/60 bg-popover" />
                  </div>

                  <button
                    onClick={() => navigate(item.to)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors duration-200 cursor-pointer',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'border border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />

                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          exit={{ opacity: 0, scaleX: 0 }}
                          transition={reduced ? { duration: 0 } : { duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                          className="origin-left overflow-hidden text-[11px] font-medium leading-none whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active route indicator bar */}
                    {isActive && (
                      <motion.div
                        className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
                        initial={{ opacity: 0, width: 4 }}
                        animate={{ opacity: 1, width: '40%' }}
                        exit={{ opacity: 0, width: 4 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
                      />
                    )}
                  </button>
                </div>
              )
            })}

            {/* Separator line between Navigation and status/controls */}
            <span className="mx-2 h-5 w-px bg-border/50" />

            {/* Active connection & device controls */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center group">
                {/* CSS-only Tooltip */}
                <div className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-[transform,opacity] duration-150 ease-out whitespace-nowrap">
                  <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-[var(--shadow-card)]">
                    Connection Mode Status
                  </div>
                  <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 border-b border-r border-border/60 bg-popover" />
                </div>
                <div>
                  <DeviceModeBadge />
                </div>
              </div>

              <div className="relative flex items-center group">
                {/* CSS-only Tooltip */}
                <div className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-[transform,opacity] duration-150 ease-out whitespace-nowrap">
                  <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-[var(--shadow-card)]">
                    Select Target Device
                  </div>
                  <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 border-b border-r border-border/60 bg-popover" />
                </div>
                <div>
                  <ActiveDeviceSelector />
                </div>
              </div>
            </div>

            <span className="mx-2 h-5 w-px bg-border/50" />

            {/* Theme switcher */}
            <div className="relative flex items-center justify-center group">
              {/* CSS-only Tooltip */}
              <div className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-[transform,opacity] duration-150 ease-out whitespace-nowrap">
                <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-[var(--shadow-card)]">
                  {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                </div>
                <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 border-b border-r border-border/60 bg-popover" />
              </div>

              <button
                onClick={handleToggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted/40 hover:text-foreground cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
