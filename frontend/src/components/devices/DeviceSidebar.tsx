import { useState } from 'react'
import { RefreshCw, Wifi, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDevices } from '@/hooks/useDevices'
import { connectWireless } from '@/services/deviceService'
import { toast } from 'sonner'
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
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
        isActive
          ? 'border-primary/40 bg-primary/5'
          : 'border-transparent hover:bg-accent/40'
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{displayName}</span>
        <span className="truncate text-muted-foreground">{device.serial}</span>
      </div>
      <span className={`text-[10px] font-medium ${stateColor}`}>
        {device.state}
      </span>
    </button>
  )
}

export function DeviceSidebar() {
  const { devices, activeSerial, nicknames, loading, refreshing, refreshDevices, selectDevice } = useDevices()
  const [address, setAddress] = useState('')
  const [connecting, setConnecting] = useState(false)

  const onlineCount = devices.filter((d) => d.state === 'device').length

  async function handleConnect() {
    if (!address.trim()) {
      toast.error('Enter an IP address like 192.168.1.100:5555')
      return
    }
    setConnecting(true)
    try {
      const result = await connectWireless(address.trim())
      toast.success(result)
      setAddress('')
      refreshDevices()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="flex h-full w-56 flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Devices
          </span>
          {devices.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
              {onlineCount}/{devices.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshDevices} disabled={refreshing}>
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && devices.length === 0 ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-center text-[11px] text-muted-foreground">No devices</p>
            <p className="text-center text-[10px] text-muted-foreground/60">
              Connect via USB or pair wirelessly
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {devices.map((device) => (
              <DeviceRow
                key={device.serial}
                device={device}
                nickname={nicknames[device.serial] ?? ''}
                isActive={device.serial === activeSerial}
                onSelect={() => selectDevice(device.serial)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/40 p-2.5">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Pair wireless
        </p>
        <div className="flex gap-1.5">
          <Input
            placeholder="192.168.1.100:5555"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            disabled={connecting}
            className="h-7 text-[11px]"
          />
          <Button
            size="sm"
            className="h-7 w-7 shrink-0 p-0"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wifi className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
