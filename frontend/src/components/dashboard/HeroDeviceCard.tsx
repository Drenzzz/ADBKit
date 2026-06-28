import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Smartphone,
  RefreshCw,
  Camera,
  Package,
  ScrollText,
  FolderOpen,
  ChevronRight,
  Power,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { DeviceInfo } from '@/lib/types'

interface HeroDeviceCardProps {
  deviceInfo: DeviceInfo
  nickname: string | undefined
  refreshing: boolean
  onRefresh: () => void
  onReboot: (mode: string) => void
}

interface ShortcutItem {
  key: string
  label: string
  description: string
  icon: React.ElementType
  iconColor: string
  path: string
}

const SHORTCUTS: ShortcutItem[] = [
  {
    key: 'screen',
    label: 'Screen Hub',
    description: 'Mirror & capture screen',
    icon: Camera,
    iconColor: 'text-primary',
    path: '/scrcpy',
  },
  {
    key: 'install',
    label: 'App Manager',
    description: 'Install & manage packages',
    icon: Package,
    iconColor: 'text-success',
    path: '/apps',
  },
  {
    key: 'logs',
    label: 'Terminal Logs',
    description: 'Run commands & stream logcat',
    icon: ScrollText,
    iconColor: 'text-warning',
    path: '/terminal',
  },
  {
    key: 'files',
    label: 'File Explorer',
    description: 'Browse device filesystem',
    icon: FolderOpen,
    iconColor: 'text-primary',
    path: '/files',
  },
]

function formatConnectedFor(since: number, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - since) / 1000))
  if (diffSec < 60) return 'just now'
  const min = Math.floor(diffSec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  const remMin = min % 60
  if (hr < 24) return remMin > 0 ? `${hr}h ${remMin}m ago` : `${hr}h ago`
  const days = Math.floor(hr / 24)
  return `${days}d ago`
}

export function HeroDeviceCard({
  deviceInfo,
  nickname,
  refreshing,
  onRefresh,
  onReboot,
}: HeroDeviceCardProps) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const connectedAtRef = useRef<{ serial: string; at: number }>({ serial: '', at: 0 })
  const [tick, setTick] = useState(Date.now())

  if (connectedAtRef.current.serial !== deviceInfo.serial) {
    connectedAtRef.current = { serial: deviceInfo.serial, at: Date.now() }
  }

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const isOnline = deviceInfo.state === 'device'
  const displayName = nickname || deviceInfo.model || deviceInfo.product || deviceInfo.serial
  const secondaryLabel = nickname
    ? (deviceInfo.model ?? deviceInfo.serial)
    : (deviceInfo.connectionLabel || deviceInfo.serial)

  // Parse battery level as integer if possible
  const batteryNum = deviceInfo.batteryLevel ? parseInt(deviceInfo.batteryLevel.replace(/%/g, ''), 10) : null

  return (
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <CardContent className="p-6 flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10">
            <Smartphone className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground truncate">
                {displayName}
              </h2>
              <span className="flex h-2 w-2 relative shrink-0">
                <span className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  isOnline ? 'bg-success' : 'bg-warning'
                )} />
                <span className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  isOnline ? 'bg-success' : 'bg-warning'
                )} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {secondaryLabel}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <span className="capitalize">{deviceInfo.state}</span>
              {isOnline && (
                <>
                  <span>·</span>
                  <span>connected {formatConnectedFor(connectedAtRef.current.at, tick)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isOnline && batteryNum !== null && (
          <div className="flex flex-col gap-1.5 bg-muted/30 border border-border/40 rounded-xl p-3.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Battery Level</span>
              <span className="text-foreground">{batteryNum}%</span>
            </div>
            <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-colors duration-500',
                  batteryNum > 20 ? 'bg-success' : 'bg-destructive'
                )}
                style={{ width: `${batteryNum}%` }}
              />
            </div>
          </div>
        )}

        {isOnline && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHORTCUTS.map((shortcut) => {
              const Icon = shortcut.icon
              return (
                <motion.button
                  key={shortcut.key}
                  type="button"
                  whileHover={reduced ? undefined : { scale: 1.01, y: -0.5 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  onClick={() => navigate(shortcut.path)}
                  className="group flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60',
                    shortcut.iconColor
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                      {shortcut.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {shortcut.description}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary/70" />
                </motion.button>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-[10px] font-mono text-muted-foreground tracking-wider truncate max-w-[50%]">
            Serial: {deviceInfo.serial}
          </span>
          <div className="flex items-center gap-2">
            {isOnline && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(buttonVariants({ variant: 'destructive', size: 'xs', className: 'h-7 gap-1 font-medium cursor-pointer' }))}
                >
                  <Power className="h-3 w-3" />
                  Reboot
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onReboot('system')} className="text-xs">
                    Reboot System
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReboot('recovery')} className="text-xs">
                    Reboot Recovery
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReboot('bootloader')} className="text-xs">
                    Reboot Bootloader
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              size="xs"
              variant="outline"
              className="h-7 gap-1.5 text-xs font-medium"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
