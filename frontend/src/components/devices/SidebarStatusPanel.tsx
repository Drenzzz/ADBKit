import { Battery, Database, Cpu, HardDrive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PerformanceSnapshot } from '@/lib/types'

interface SidebarStatusPanelProps {
  snapshot: PerformanceSnapshot | null
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 GB'
  const gb = 1024 * 1024 * 1024
  return `${(bytes / gb).toFixed(1)} GB`
}

function getTempColorClass(temp?: number): string {
  if (!temp) return 'text-muted-foreground'
  if (temp > 42) return 'text-destructive font-semibold animate-pulse'
  if (temp > 37) return 'text-warning font-semibold'
  return 'text-success font-medium'
}

export function SidebarStatusPanel({ snapshot }: SidebarStatusPanelProps) {
  if (!snapshot) return null

  // Calculate storage percentage
  const totalStorage = snapshot.storageTotalBytes || 0
  const usedStorage = snapshot.storageUsedBytes || 0
  const freeStorage = totalStorage > usedStorage ? totalStorage - usedStorage : 0
  const storagePercent = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0

  // Calculate battery percentage
  const batteryPercent = snapshot.batteryLevel || 0

  return (
    <div className="flex flex-col gap-5">
      {/* Battery Card */}
      <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            <Battery className="h-3.5 w-3.5" />
            Power & Thermals
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 flex flex-col gap-4">
          {/* Battery level bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Charge Capacity</span>
              <span className="text-foreground">{batteryPercent}%</span>
            </div>
            <div className="h-2 w-full bg-border/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  batteryPercent > 20 ? 'bg-success' : 'bg-destructive'
                )}
                style={{ width: `${batteryPercent}%` }}
              />
            </div>
          </div>

          {/* Battery Temp indicator */}
          {snapshot.batteryTemperatureC !== undefined && (
            <div className="flex items-center justify-between text-xs border-t border-border/40 pt-3">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground/80" />
                Battery Temperature
              </span>
              <span className={cn('font-mono', getTempColorClass(snapshot.batteryTemperatureC))}>
                {snapshot.batteryTemperatureC.toFixed(1)}°C
              </span>
            </div>
          )}

          {/* Battery Power Delivery source row */}
          <div className="flex items-center justify-between text-xs border-t border-border/40 pt-3">
            <span className="text-muted-foreground font-medium">Power Delivery</span>
            <span className="text-foreground font-medium">USB Connection</span>
          </div>
        </CardContent>
      </Card>

      {/* Storage Card */}
      <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            <Database className="h-3.5 w-3.5" />
            Storage Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 flex flex-col gap-4">
          {/* Storage progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Internal Disk</span>
              <span className="text-foreground text-[11px] font-mono">
                {formatBytes(usedStorage)} of {formatBytes(totalStorage)}
              </span>
            </div>
            <div className="h-2 w-full bg-border/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>

          {/* Available storage details */}
          <div className="flex items-center justify-between text-xs border-t border-border/40 pt-3">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground/80" />
              Available Storage
            </span>
            <span className="text-foreground font-mono font-medium">
              {formatBytes(freeStorage)}
            </span>
          </div>

          {/* Capacity free status row */}
          <div className="flex items-center justify-between text-xs border-t border-border/40 pt-3">
            <span className="text-muted-foreground font-medium">Capacity Remaining</span>
            <span className="text-success font-medium">
              {(100 - storagePercent).toFixed(1)}% free
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
