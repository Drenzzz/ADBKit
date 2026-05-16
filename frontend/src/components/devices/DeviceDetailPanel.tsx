import { useEffect, useCallback } from 'react'
import {
  Building, Code, Cpu, Database, Hash, Info, RefreshCw, Server,
  ShieldCheck, Smartphone, Tag, Wifi, Battery,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDeviceInfo } from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value || '—'}</div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function DeviceDetailPanel() {
  const { activeSerial, deviceInfo, infoLoading, setDeviceInfo, setInfoLoading, setError } = useDeviceStore()

  const refresh = useCallback(async () => {
    if (!activeSerial) {
      setDeviceInfo(null)
      return
    }
    setInfoLoading(true)
    setError(null)
    try {
      const info = await getDeviceInfo(activeSerial)
      setDeviceInfo(info)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch device info')
      setDeviceInfo(null)
    } finally {
      setInfoLoading(false)
    }
  }, [activeSerial, setDeviceInfo, setInfoLoading, setError])

  useEffect(() => {
    refresh()
  }, [refresh])

  const items = deviceInfo
    ? [
        { icon: <Building className="h-4 w-4" />, label: 'Brand', value: deviceInfo.brand },
        { icon: <Tag className="h-4 w-4" />, label: 'Device Name', value: deviceInfo.connectionLabel },
        { icon: <Code className="h-4 w-4" />, label: 'Codename', value: deviceInfo.codename },
        { icon: <Smartphone className="h-4 w-4" />, label: 'Model', value: deviceInfo.model },
        { icon: <Hash className="h-4 w-4" />, label: 'Serial', value: deviceInfo.serial },
        { icon: <Server className="h-4 w-4" />, label: 'Build ID', value: deviceInfo.buildId },
        { icon: <Info className="h-4 w-4" />, label: 'Android Version', value: deviceInfo.androidVersion },
        { icon: <Cpu className="h-4 w-4" />, label: 'SDK Version', value: deviceInfo.sdkVersion },
        { icon: <ShieldCheck className="h-4 w-4" />, label: 'Security Patch', value: deviceInfo.securityPatch },
        { icon: <Battery className="h-4 w-4" />, label: 'Battery', value: deviceInfo.batteryLevel },
        { icon: <Cpu className="h-4 w-4" />, label: 'RAM', value: deviceInfo.ramTotal },
        { icon: <Database className="h-4 w-4" />, label: 'Storage', value: deviceInfo.storageInfo },
        { icon: <Wifi className="h-4 w-4" />, label: 'IP Address', value: deviceInfo.ipAddress },
        { icon: <ShieldCheck className="h-4 w-4" />, label: 'Root Status', value: deviceInfo.rootStatus },
        { icon: <Cpu className="h-4 w-4" />, label: 'ABIs', value: deviceInfo.abis },
      ]
    : []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="h-4 w-4" />
          Device Details
        </CardTitle>
        <Button variant="outline" size="sm" onClick={refresh} disabled={infoLoading || !activeSerial}>
          <RefreshCw className={`h-3.5 w-3.5 ${infoLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!activeSerial ? (
          <p className="text-sm text-muted-foreground">Select a device from the Dashboard first.</p>
        ) : infoLoading && !deviceInfo ? (
          <LoadingSkeleton />
        ) : !deviceInfo ? (
          <p className="text-sm text-muted-foreground">No device info available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <InfoRow key={item.label} {...item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
