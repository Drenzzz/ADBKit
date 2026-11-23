import {
  IconRefresh as RefreshCw,
  IconDeviceMobile as Smartphone
} from "@tabler/icons-react"
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { useDevices } from '@/hooks/useDevices'
import type { DeviceSummary } from '@/lib/types'

function DeviceRow({ device, nickname, isActive, onSelect }: {
  device: DeviceSummary
  nickname: string
  isActive: boolean
  onSelect: () => void
}) {
  const stateColor = device.state === 'device'
    ? 'text-success'
    : device.state === 'unauthorized'
      ? 'text-warning'
      : device.state === 'offline'
        ? 'text-muted-foreground'
        : 'text-info'

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
          <span className="text-[14px] font-medium">{displayName}</span>
          {isActive && <Badge variant="success" label="active" />}
        </div>
        {displayName !== device.serial && (
          <span className="text-[13px] text-muted-foreground font-mono">{device.serial}</span>
        )}
        {device.mode === 'fastboot' && (
          <span className="text-[14px] text-muted-foreground">fastboot</span>
        )}
      </div>
      <span className={`text-[14px] font-medium ${stateColor}`}>
        {device.state}
      </span>
    </button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton height={48} width="100%" radius={2} />
      <Skeleton height={48} width="100%" radius={2} />
    </div>
  )
}

export function DeviceListCard() {
  const { devices, activeSerial, loading, refreshing, refreshDevices, selectDevice, nicknames } = useDevices()

  return (
    <section className="m3-surface rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[var(--color-text-primary)]">
          <span className="text-[var(--color-text-secondary)]"><Smartphone className="h-4 w-4" /></span>
          Connected Devices
        </h3>
        <Button
          variant="ghost"
          isIconOnly
          size="sm"
          onClick={refreshDevices}
          isDisabled={refreshing}
          label="Refresh devices"
          icon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
        />
      </div>
      {loading && devices.length === 0 ? (
        <LoadingSkeleton />
      ) : devices.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">
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
    </section>
  )
}
