import { NavLink } from 'react-router-dom'
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

export function BottomDock() {
  const { theme, toggleTheme } = useUIStore()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-0.5 px-4 py-1.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              `group relative flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 transition-all duration-150 ${
                isActive
                  ? 'bg-accent/80 text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <span className="mx-1 h-5 w-px bg-border/50" />

        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent/40 hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-[10px] font-medium leading-none">Theme</span>
        </button>
      </div>
    </nav>
  )
}
