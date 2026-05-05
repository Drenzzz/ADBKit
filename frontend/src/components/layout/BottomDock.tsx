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
} from 'lucide-react'

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
  return (
    <nav className="border-t border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-center gap-1 px-4 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
