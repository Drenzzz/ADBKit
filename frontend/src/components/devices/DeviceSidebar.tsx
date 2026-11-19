import { useState } from 'react'
import {
  IconWifi,
  IconLoader2,
} from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { HStack } from '@astryxdesign/core/HStack'
import { VStack } from '@astryxdesign/core/VStack'
import { useDevices } from '@/hooks/useDevices'
import { connectWireless } from '@/services/deviceService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DeviceSummary } from '@/lib/types'

function DeviceRow({ device, nickname, isActive, onSelect }: {
  device: DeviceSummary
  nickname: string
  isActive: boolean
  onSelect: () => void
}) {
  const online = device.state === 'device'
  const name = nickname || device.model || device.product || device.serial

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl p-3 text-left transition-[transform,background-color] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50',
        isActive
          ? 'bg-[var(--color-accent-muted)]'
          : 'hover:bg-[var(--color-background-muted)]',
      )}
    >
      <HStack gap={2} vAlign="center">
        <div className="min-w-0 flex-1">
          <Text type="body" weight="semibold" maxLines={1}>{name}</Text>
          <Text type="code" color="secondary" maxLines={1}>{device.serial}</Text>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            online ? 'bg-[var(--color-success)]' : device.state === 'unauthorized' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-text-disabled)]',
          )}
        />
      </HStack>
    </button>
  )
}

export function DeviceSidebar() {
  const { devices, activeSerial, nicknames, loading, refreshDevices, selectDevice } = useDevices()
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
    <div className="m3-surface flex h-full w-64 shrink-0 flex-col overflow-hidden p-3">
      <HStack gap={2} vAlign="center" className="px-1 pb-2">
        <div className="min-w-0 flex-1">
          <Heading level={2} weight="semibold">Devices</Heading>
          {devices.length > 0 && (
            <Text type="body" color="secondary" hasTabularNumbers>{onlineCount} of {devices.length} online</Text>
          )}
        </div>
      </HStack>
      <div className="flex-1 overflow-y-auto">
        {loading && devices.length === 0 ? (
          <VStack gap={2} className="p-1">
            <div className="m3-inset h-14 animate-pulse motion-reduce:animate-none" />
            <div className="m3-inset h-14 animate-pulse motion-reduce:animate-none" />
          </VStack>
        ) : devices.length === 0 ? (
          <VStack gap={1} className="items-center px-2 py-10 text-center">
            <Text type="body" weight="medium">No devices</Text>
            <Text type="body" color="secondary">Connect over USB or pair wirelessly.</Text>
          </VStack>
        ) : (
          <VStack gap={1}>
            {devices.map((device) => (
              <DeviceRow
                key={device.serial}
                device={device}
                nickname={nicknames[device.serial] ?? ''}
                isActive={device.serial === activeSerial}
                onSelect={() => selectDevice(device.serial)}
              />
            ))}
          </VStack>
        )}
      </div>

      <VStack gap={2} className="m3-inset mt-2 p-3">
        <Text type="body" weight="medium">Pair wireless</Text>
        <HStack gap={2}>
          <div className="min-w-0 flex-1">
            <TextInput
              label="Address"
              isLabelHidden
              placeholder="192.168.1.100:5555"
              value={address}
              onChange={setAddress}
              onEnter={handleConnect}
              isDisabled={connecting}
            />
          </div>
          <Button label="Pair" icon={connecting ? <IconLoader2 size={18} className="animate-spin" /> : <IconWifi size={18} stroke={1.75} />} variant="primary" onClick={handleConnect} isDisabled={connecting} />
        </HStack>
      </VStack>
    </div>
  )
}
