import { Cpu, MemoryStick, Wifi, Activity, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatTile } from '@/components/ui/stat-tile'
import { useMetricsHistoryStore } from '@/stores/metricsHistoryStore'
import type { PerformanceSnapshot } from '@/lib/types'

interface PerformancePanelProps {
  snapshot: PerformanceSnapshot | null
  error: string | null
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const kb = 1024
  const mb = kb * 1024
  const gb = mb * 1024
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`
  return `${(bytes / kb).toFixed(0)} KB`
}

function formatBytesPerSec(bps?: number): string {
  if (!bps || bps <= 0) return '0 B/s'
  return `${formatBytes(bps)}/s`
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

export function PerformancePanel({ snapshot, error }: PerformancePanelProps) {
  const cpuHistory = useMetricsHistoryStore((state) => state.cpuHistory)
  const ramHistory = useMetricsHistoryStore((state) => state.ramHistory)
  const rxHistory = useMetricsHistoryStore((state) => state.rxHistory)

  return (
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          <Activity className="h-3.5 w-3.5" />
          Performance Telemetry
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {error ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-destructive text-center">{error}</p>
          </div>
        ) : !snapshot ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-xs">Connecting diagnostics stream...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatTile
              icon={<Cpu className="h-3.5 w-3.5 text-muted-foreground" />}
              label="CPU Activity"
              value={`${snapshot.cpuUsage.toFixed(1)}%`}
              sublabel="Process Load: Active"
              trend={cpuHistory}
              trendColor="#007AFF"
              trendHeight={44}
              valueTone={cpuTone(snapshot.cpuUsage)}
              className="py-4 px-3.5 gap-2.5"
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
              trendColor="#34C759"
              trendHeight={44}
              valueTone={ramTone(snapshot.ramUsage)}
              className="py-4 px-3.5 gap-2.5"
            />
            <StatTile
              icon={<Wifi className="h-3.5 w-3.5 text-muted-foreground" />}
              label="Network Link"
              value={`↓ ${formatBytesPerSec(snapshot.networkRxSec)}`}
              sublabel={`↑ ${formatBytesPerSec(snapshot.networkTxSec)}`}
              trend={rxHistory}
              trendColor="#5856D6"
              trendHeight={44}
              className="py-4 px-3.5 gap-2.5"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
