import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
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
  RefreshCw,
  Camera,
} from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { getDevices } from '@/services/deviceService'
import { toast } from 'sonner'

const routeCommands = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/devices', label: 'Devices', icon: Smartphone },
  { path: '/apps', label: 'Apps', icon: Package },
  { path: '/files', label: 'Files', icon: FolderOpen },
  { path: '/flasher', label: 'Flasher', icon: Zap },
  { path: '/terminal', label: 'Terminal', icon: Terminal },
  { path: '/scrcpy', label: 'Scrcpy Hub', icon: MonitorPlay },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, theme, toggleTheme } = useUIStore()
  const navigate = useNavigate()

  const handleRefreshDevices = useCallback(async () => {
    setCommandPaletteOpen(false)
    try {
      const nextDevices = await getDevices()
      useDeviceStore.getState().setDevices(nextDevices)
      useDeviceStore.getState().setLastUpdatedAt(Date.now())
      toast.success(`Found ${nextDevices.length} device(s)`)
    } catch {
      toast.error('Failed to refresh devices')
    }
  }, [setCommandPaletteOpen])

  const handleScreenshot = useCallback(() => {
    setCommandPaletteOpen(false)
    const { activeSerial } = useDeviceStore.getState()
    if (!activeSerial) {
      toast.error('No active device connected')
      return
    }
    navigate('/scrcpy')
  }, [setCommandPaletteOpen, navigate])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    },
    [commandPaletteOpen, setCommandPaletteOpen],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!commandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <Command className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
        <Command.Input
          placeholder="Type a command or search..."
          className="flex h-11 w-full rounded-t-xl border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-72 overflow-y-auto p-1.5">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation" className="text-xs text-muted-foreground">
            {routeCommands.map(({ path, label, icon: Icon }) => (
              <Command.Item
                key={path}
                value={label}
                onSelect={() => {
                  navigate(path)
                  setCommandPaletteOpen(false)
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent/50 data-[selected=true]:bg-accent/60"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-border/50" />

          <Command.Group heading="Actions" className="text-xs text-muted-foreground">
            <Command.Item
              value="Refresh devices"
              onSelect={() => void handleRefreshDevices()}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent/50 data-[selected=true]:bg-accent/60"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span>Refresh connected devices</span>
            </Command.Item>
            <Command.Item
              value="Open terminal"
              onSelect={() => {
                navigate('/terminal')
                setCommandPaletteOpen(false)
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent/50 data-[selected=true]:bg-accent/60"
            >
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span>Open terminal session</span>
            </Command.Item>
            <Command.Item
              value="Screenshot"
              onSelect={handleScreenshot}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent/50 data-[selected=true]:bg-accent/60"
            >
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span>Open Scrcpy Hub</span>
            </Command.Item>
            <Command.Item
              value="Toggle theme"
              onSelect={() => {
                toggleTheme()
                setCommandPaletteOpen(false)
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent/50 data-[selected=true]:bg-accent/60"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground">
            Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">Esc</kbd> to close
          </span>
          <span className="text-[10px] text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">Ctrl+K</kbd> to toggle
          </span>
        </div>
      </Command>
    </div>
  )
}
