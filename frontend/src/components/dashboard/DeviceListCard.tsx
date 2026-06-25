import { RefreshCw, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDevices } from '@/hooks/useDevices'
import type { DeviceSummary } from '@/lib/types'

function DeviceRow({ device, nickname, isActive, onSelect }: {
  device: DeviceSummary
  nickname: string
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

  const displayName = nickname || device.model || device.product || device.serial

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
          <span className="text-sm font-medium">{displayName}</span>
          {isActive && <Badge variant="default" className="text-[10px]">active</Badge>}
        </div>
        {displayName !== device.serial && (
          <span className="text-xs text-muted-foreground font-mono">{device.serial}</span>
        )}
        {device.mode === 'fastboot' && (
          <span className="text-xs text-muted-foreground">fastboot</span>
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
  const { devices, activeSerial, loading, refreshing, refreshDevices, selectDevice, nicknames } = useDevices()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="h-4 w-4" />
          Connected Devices
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={refreshDevices} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && devices.length === 0 ? (
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
                nickname={nicknames[device.serial] ?? ''}
                isActive={activeSerial === device.serial}
                onSelect={() => selectDevice(device.serial)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
