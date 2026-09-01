import {
  IconCpu as Cpu,
  IconDeviceSdCard as MemoryStick,
  IconWifi as Wifi,
  IconLoader2 as Loader2,
  IconActivity as Activity
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatTile } from '@/components/ui/stat-tile'
import { useMetricsHistoryStore } from '@/stores/metricsHistoryStore'
import { useDevices } from '@/hooks/useDevices'
import { useMonitor } from '@/hooks/useMonitor'

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const kb = 1024
  const mb = kb * 1024
  const gb = mb * 1024
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`
  return `${(bytes / kb).toFixed(0)} KB`
}

function formatBytesPerSec(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s'
  return `${formatBytes(bytesPerSec)}/s`
}

function cpuTone(percent: number): 'default' | 'warning' | 'danger' {
  if (percent > 80) return 'danger'
  if (percent > 60) return 'warning'
  return 'default'
}

function ramTone(percent: number): 'default' | 'warning' | 'danger' {
  if (percent > 85) return 'danger'
  if (percent > 65) return 'warning'
  return 'default'
}

export function LiveMonitorCard() {
  const { activeSerial, deviceInfo } = useDevices()
  const isDeviceOnline = deviceInfo?.state === 'device'

  const { snapshot, polling, error } = useMonitor(activeSerial, isDeviceOnline)

  const cpuHistory = useMetricsHistoryStore((state) => state.cpuHistory)
  const ramHistory = useMetricsHistoryStore((state) => state.ramHistory)
  const rxHistory = useMetricsHistoryStore((state) => state.rxHistory)

  if (!activeSerial || !isDeviceOnline) {
    return (
      <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            <Activity className="h-3.5 w-3.5" />
            Live Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex items-center justify-center min-h-[160px]">
          <p className="text-xs text-muted-foreground">Monitor is waiting for an active online device.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          <Activity className="h-3.5 w-3.5" />
          Live Monitor
        </CardTitle>
        {polling && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {error ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-destructive text-center">{error}</p>
          </div>
        ) : !snapshot ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-[11px]">Initializing diagnostics...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <StatTile
              icon={<Cpu className="h-3.5 w-3.5 text-muted-foreground" />}
              label="CPU Usage"
              value={`${snapshot.cpuUsage.toFixed(1)}%`}
              trend={cpuHistory}
              trendColor="var(--chart-primary)"
              valueTone={cpuTone(snapshot.cpuUsage)}
            />
            <StatTile
              icon={<MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />}
              label="RAM Utilization"
              value={`${snapshot.ramUsage.toFixed(1)}%`}
              sublabel={
                snapshot.ramUsedBytes && snapshot.ramTotalBytes
                  ? `${formatBytes(snapshot.ramUsedBytes)} / ${formatBytes(snapshot.ramTotalBytes)}`
                  : undefined
              }
              trend={ramHistory}
              trendColor="var(--chart-secondary)"
              valueTone={ramTone(snapshot.ramUsage)}
            />
            <StatTile
              icon={<Wifi className="h-3.5 w-3.5 text-muted-foreground" />}
              label="Network Link"
              value={`↓ ${formatBytesPerSec(snapshot.networkRxSec)}`}
              sublabel={`↑ ${formatBytesPerSec(snapshot.networkTxSec)}`}
              trend={rxHistory}
              trendColor="var(--chart-tertiary)"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
