import { useEffect, useCallback } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPerformanceSnapshot } from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—'
  const kb = 1024
  const mb = kb * 1024
  const gb = mb * 1024
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`
  return `${(bytes / kb).toFixed(0)} KB`
}

function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h >= 24) {
    const d = Math.floor(h / 24)
    const rh = h % 24
    return `${d}d ${rh}h ${m}m`
  }
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function PerformancePanel() {
  const { activeSerial, performance, perfLoading, setPerformance, setPerfLoading, setError } = useDeviceStore()

  const refresh = useCallback(async () => {
    if (!activeSerial) {
      setPerformance(null)
      return
    }
    setPerfLoading(true)
    setError(null)
    try {
      const snap = await getPerformanceSnapshot(activeSerial)
      setPerformance(snap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch performance data')
      setPerformance(null)
    } finally {
      setPerfLoading(false)
    }
  }, [activeSerial, setPerformance, setPerfLoading, setError])

  useEffect(() => {
    refresh()
    if (activeSerial) {
      const interval = setInterval(refresh, 5000)
      return () => clearInterval(interval)
    }
  }, [refresh, activeSerial])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
        <Button variant="outline" size="sm" onClick={refresh} disabled={perfLoading || !activeSerial}>
          <RefreshCw className={`h-3.5 w-3.5 ${perfLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!activeSerial ? (
          <p className="text-sm text-muted-foreground">Select a device first.</p>
        ) : perfLoading && !performance ? (
          <LoadingSkeleton />
        ) : !performance ? (
          <p className="text-sm text-muted-foreground">No performance data available.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Metric label="CPU Usage" value={`${performance.cpuUsage.toFixed(1)}%`} />
            <Metric label="RAM Usage" value={`${performance.ramUsage.toFixed(1)}%`} />
            <Metric label="RAM Used" value={formatBytes(performance.ramUsedBytes)} />
            <Metric label="RAM Total" value={formatBytes(performance.ramTotalBytes)} />
            <Metric label="Battery" value={performance.batteryLevel ? `${performance.batteryLevel}%` : '—'} />
            <Metric label="Battery Temp" value={performance.batteryTemperatureC ? `${performance.batteryTemperatureC.toFixed(1)}°C` : '—'} />
            <Metric label="Storage Used" value={formatBytes(performance.storageUsedBytes)} />
            <Metric label="Storage Total" value={formatBytes(performance.storageTotalBytes)} />
            <Metric label="Network RX" value={formatBytes(performance.networkRxBytes)} />
            <Metric label="Network TX" value={formatBytes(performance.networkTxBytes)} />
            <Metric label="Uptime" value={formatUptime(performance.uptimeSeconds)} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
