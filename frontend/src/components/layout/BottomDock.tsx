import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
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
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme: setLocalTheme } = useUIStore()
  const { appConfig, setTheme: persistTheme } = useSettings()

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [indicatorPos, setIndicatorPos] = useState({ left: 0, width: 20 })
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isThemeHovered, setIsThemeHovered] = useState(false)
  const [isBadgeHovered, setIsBadgeHovered] = useState(false)
  const [isSelectorHovered, setIsSelectorHovered] = useState(false)

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

  function updateIndicator() {
    const activeIdx = navItems.findIndex((item) => {
      if (item.to === '/') {
        return location.pathname === '/'
      }
      return location.pathname.startsWith(item.to)
    })
    if (activeIdx === -1) return

    const activeEl = itemRefs.current[activeIdx]
    const containerEl = containerRef.current
    if (!activeEl || !containerEl) return

    const activeRect = activeEl.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()

    const horizontalPadding = 10
    const width = Math.max(20, activeRect.width - horizontalPadding * 2)
    const left = activeRect.left - containerRect.left + horizontalPadding

    setIndicatorPos({ left, width })
  }

  useLayoutEffect(() => {
    updateIndicator()
  }, [location.pathname, isVisible])

  useEffect(() => {
    function handleResize() {
      updateIndicator()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [location.pathname, isVisible])

  useEffect(() => {
    if (!isVisible) return

    const activeIdx = navItems.findIndex((item) => {
      if (item.to === '/') {
        return location.pathname === '/'
      }
      return location.pathname.startsWith(item.to)
    })
    if (activeIdx === -1) return

    const activeEl = itemRefs.current[activeIdx]
    if (!activeEl) return

    const resizeObserver = new ResizeObserver(() => {
      updateIndicator()
    })
    resizeObserver.observe(activeEl)

    return () => {
      resizeObserver.disconnect()
    }
  }, [location.pathname, isVisible])

  useEffect(() => {
    if (!isVisible) return
    const rafId = window.requestAnimationFrame(() => {
      updateIndicator()
    })
    return () => window.cancelAnimationFrame(rafId)
  }, [hoveredIndex, isVisible, location.pathname])

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
      setHoveredIndex(null)
    }, HIDE_DELAY_MS)
  }

  return (
    <>
      {/* Invisible hover trigger area at the bottom */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 h-8"
        onMouseEnter={handleDockMouseEnter}
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'fixed bottom-3 left-1/2 z-50 -translate-x-1/2',
              'flex items-center gap-0.5 px-3 py-1.5',
              'rounded-2xl border border-border/60 bg-popover/80 shadow-[var(--shadow-floating)] backdrop-blur-xl backdrop-saturate-150',
            )}
            onMouseEnter={handleDockMouseEnter}
            onMouseLeave={handleDockMouseLeave}
          >
            {navItems.map((item, index) => {
              const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
              const Icon = item.icon
              const isHovered = hoveredIndex === index

              return (
                <div key={item.to} className="relative flex flex-col items-center">
                  <AnimatePresence>
                    {isHovered && !isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap"
                      >
                        <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-[var(--shadow-card)]">
                          {item.label}
                        </div>
                        <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 border-b border-r border-border/60 bg-popover" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    ref={(el) => {
                      itemRefs.current[index] = el
                    }}
                    onClick={() => navigate(item.to)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.5 }}
                    className={cn(
                      'relative flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'border border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />

                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, width: 0, x: -4 }}
                          animate={{ opacity: 1, width: 'auto', x: 0 }}
                          exit={{ opacity: 0, width: 0, x: -4 }}
                          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                          className="overflow-hidden text-[11px] font-medium leading-none whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              )
            })}

            {/* Separator line between Navigation and status/controls */}
            <span className="mx-2 h-5 w-px bg-border/50" />

            {/* Active connection & device controls */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <AnimatePresence>
                  {isBadgeHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap"
                    >
                      <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-[var(--shadow-card)]">
                        Connection Mode Status
                      </div>
                      <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 border-b border-r border-border/60 bg-popover" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div
                  onMouseEnter={() => setIsBadgeHovered(true)}
                  onMouseLeave={() => setIsBadgeHovered(false)}
                >
                  <DeviceModeBadge />
                </div>
              </div>

              <div className="relative flex items-center">
                <AnimatePresence>
                  {isSelectorHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap"
                    >
                      <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-[var(--shadow-card)]">
                        Select Target Device
                      </div>
                      <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 border-b border-r border-border/60 bg-popover" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div
                  onMouseEnter={() => setIsSelectorHovered(true)}
                  onMouseLeave={() => setIsSelectorHovered(false)}
                >
                  <ActiveDeviceSelector />
                </div>
              </div>
            </div>

            <span className="mx-2 h-5 w-px bg-border/50" />

            {/* Theme switcher */}
            <div className="relative flex items-center justify-center">
              <AnimatePresence>
                {isThemeHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap"
                  >
                    <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-[var(--shadow-card)]">
                      {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    </div>
                    <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 border-b border-r border-border/60 bg-popover" />
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleToggleTheme}
                onMouseEnter={() => setIsThemeHovered(true)}
                onMouseLeave={() => setIsThemeHovered(false)}
                className="flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-all duration-150 hover:bg-muted/40 hover:text-foreground"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>

            {/* macOS Active route indicator bar */}
            <motion.div
              className="pointer-events-none absolute bottom-1.5 h-[2.5px] rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
              animate={{ left: indicatorPos.left, width: indicatorPos.width }}
              transition={{ type: 'spring', stiffness: 460, damping: 32, mass: 0.42 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
