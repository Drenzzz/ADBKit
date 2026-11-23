import {
  IconCpu as Cpu,
  IconDeviceSdCard as MemoryStick,
  IconWifi as Wifi,
  IconActivity as Activity,
  IconLoader2 as Loader2
} from "@tabler/icons-react"
import { useMetricsHistoryStore } from '@/stores/metricsHistoryStore'
import type { PerformanceSnapshot } from '@/lib/types'

function Sparkline({ data, height = 24, width = 80, color = 'currentColor', fill = true, className }: {
  data: number[]
  height?: number
  width?: number
  color?: string
  fill?: boolean
  className?: string
}) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const padding = 1
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * (width - padding * 2) + padding,
    y: height - padding - ((val - min) / range) * (height - padding * 2),
  }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]
  const fillPath = fill && last && first
    ? `${linePath} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`
    : ''
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      {fill && <path d={fillPath} fill={color} opacity={0.1} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

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

const TONE_CLASS: Record<'default' | 'warning' | 'danger', string> = {
  default: 'text-foreground',
  warning: 'text-warning',
  danger: 'text-destructive',
}

function Tile({ icon, label, value, sublabel, trend, trendColor, tone = 'default' }: {
  icon: React.ReactNode
  label: string
  value: string
  sublabel?: string
  trend?: number[]
  trendColor?: string
  tone?: 'default' | 'warning' | 'danger'
}) {
  return (
    <div className="m3-inset flex flex-col gap-2.5 px-3.5 py-4 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background">
            {icon}
          </div>
          <span className="truncate text-[14px] text-muted-foreground">{label}</span>
        </div>
        <span className={`shrink-0 text-[14px] font-semibold tabular ${TONE_CLASS[tone]}`}>
          {value}
        </span>
      </div>

      {trend && trend.length >= 2 && (
        <Sparkline
          data={trend}
          height={44}
          width={120}
          color={trendColor ?? 'var(--color-accent)'}
          className="mt-0.5 w-full"
        />
      )}

      {sublabel && (
        <span className="font-mono text-[13px] tabular text-muted-foreground">{sublabel}</span>
      )}
    </div>
  )
}

export function PerformancePanel({ snapshot, error }: PerformancePanelProps) {
  const cpuHistory = useMetricsHistoryStore((state) => state.cpuHistory)
  const ramHistory = useMetricsHistoryStore((state) => state.ramHistory)
  const rxHistory = useMetricsHistoryStore((state) => state.rxHistory)

  return (
    <section className="m3-surface rounded-3xl p-5 border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <h3 className="mb-4 flex items-center gap-2.5 text-[18px] font-semibold text-[var(--color-text-primary)]">
        <span className="text-[var(--color-text-secondary)]"><Activity className="h-3.5 w-3.5" /></span>
        Performance telemetry
      </h3>
      {error ? (
        <div className="flex items-center justify-center py-6">
          <p className="text-[14px] text-destructive text-center">{error}</p>
        </div>
      ) : !snapshot ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-[14px]">Connecting diagnostics stream...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tile
            icon={<Cpu className="h-3.5 w-3.5 text-muted-foreground" />}
            label="CPU Activity"
            value={`${snapshot.cpuUsage.toFixed(1)}%`}
            sublabel="Process Load: Active"
            trend={cpuHistory}
            trendColor="var(--chart-primary)"
            tone={cpuTone(snapshot.cpuUsage)}
          />
          <Tile
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
            tone={ramTone(snapshot.ramUsage)}
          />
          <Tile
            icon={<Wifi className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Network Link"
            value={`↓ ${formatBytesPerSec(snapshot.networkRxSec)}`}
            sublabel={`↑ ${formatBytesPerSec(snapshot.networkTxSec)}`}
            trend={rxHistory}
            trendColor="var(--chart-tertiary)"
          />
        </div>
      )}
    </section>
  )
}