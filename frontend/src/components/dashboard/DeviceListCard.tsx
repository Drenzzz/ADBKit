import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDevices } from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'
import type { DeviceSummary } from '@/lib/types'

function DeviceRow({ device, isActive, onSelect }: {
  device: DeviceSummary
  isActive: boolean
  onSelect: () => void
}) {
  const stateColor = device.state === 'device'
    ? 'text-green-500'
    : device.state === 'unauthorized'
      ? 'text-yellow-500'
      : device.state === 'offline'
        ? 'text-muted-foreground'
        : 'text-blue-400'

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
        isActive
          ? 'border-primary/40 bg-primary/5'
          : 'border-transparent hover:bg-accent/40'
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{device.serial}</span>
          {isActive && <Badge variant="default" className="text-[10px]">active</Badge>}
        </div>
        {(device.model || device.product) && (
          <span className="text-xs text-muted-foreground">
            {device.model || device.product}
            {device.mode === 'fastboot' ? ' (fastboot)' : ''}
          </span>
        )}
      </div>
      <span className={`text-xs font-medium ${stateColor}`}>
        {device.state}
      </span>
    </button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

export function DeviceListCard() {
  const { devices, activeSerial, devicesLoading, setDevices, setActiveSerial, setDevicesLoading, setError } = useDeviceStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setDevicesLoading(true)
    setError(null)
    try {
      const list = await getDevices()
      setDevices(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch devices')
    } finally {
      setDevicesLoading(false)
    }
  }, [setDevices, setDevicesLoading, setError])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [refresh])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="h-4 w-4" />
          Connected Devices
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {devicesLoading && devices.length === 0 ? (
          <LoadingSkeleton />
        ) : devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No device detected. Ensure USB Debugging is enabled.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {devices.map((device) => (
              <DeviceRow
                key={device.serial}
                device={device}
                isActive={activeSerial === device.serial}
                onSelect={() => setActiveSerial(device.serial)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
