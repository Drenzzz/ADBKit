import { useEffect, useState } from 'react'
import { IconWifi, IconUsb, IconPlugConnected } from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { HStack } from '@astryxdesign/core/HStack'
import { VStack } from '@astryxdesign/core/VStack'
import {
  connectWireless,
  disconnectWireless,
  enableWirelessTCPIP,
  getWirelessHistory,
  saveWirelessHistory,
} from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'
import type { WirelessHistoryEntry } from '@/lib/types'
import { toast } from 'sonner'

export function ConnectionPanel() {
  const { devices } = useDeviceStore()
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('5555')
  const [deviceName, setDeviceName] = useState('')
  const [history, setHistory] = useState<WirelessHistoryEntry[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [enabling, setEnabling] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const hasUsbDevice = devices.some((d) => d.mode === 'adb' && d.state === 'device')
  const busy = connecting || disconnecting

  useEffect(() => {
    let cancelled = false
    void getWirelessHistory()
      .then((entries) => {
        if (!cancelled) setHistory(entries)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleEnable = async () => {
    setEnabling(true)
    try {
      const message = await enableWirelessTCPIP(port)
      toast.success('Wireless mode enabled', { description: message })
    } catch (e) {
      toast.error('Could not enable wireless mode', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setEnabling(false)
    }
  }

  const handleConnect = async () => {
    if (!ip) {
      toast.error('IP address is required')
      return
    }
    setConnecting(true)
    try {
      const address = `${ip.trim()}:${port.trim()}`
      const message = await connectWireless(address)
      toast.success('Device connected', { description: message })

      const entry = { address, name: deviceName.trim() || address }
      const next = [
        entry,
        ...history.filter((saved) => saved.address.toLowerCase() !== address.toLowerCase()),
      ]
      setHistory(next)
      setSelectedAddress(address)
      try {
        await saveWirelessHistory(next)
      } catch (e) {
        toast.error('Could not save device', {
          description: e instanceof Error ? e.message : String(e),
        })
      }
    } catch (e) {
      toast.error('Connection failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!ip) {
      toast.error('IP address is required')
      return
    }
    setDisconnecting(true)
    try {
      const address = `${ip.trim()}:${port.trim()}`
      const message = await disconnectWireless(address)
      toast.success('Device disconnected', { description: message })
    } catch (e) {
      toast.error('Disconnection failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setDisconnecting(false)
    }
  }

  function loadSaved(address: string) {
    setSelectedAddress(address)
    const entry = history.find((saved) => saved.address === address)
    if (!entry) return
    const separator = address.lastIndexOf(':')
    if (separator > 0) {
      setIp(address.slice(0, separator))
      setPort(address.slice(separator + 1))
    }
    setDeviceName(entry.name)
  }

  return (
    <div className="m3-surface p-5">
      <VStack gap={4}>
        <HStack gap={2} vAlign="center">
          <IconWifi size={18} stroke={1.75} className="text-[var(--color-text-secondary)]" />
          <Heading level={2} weight="semibold">Wireless connection</Heading>
        </HStack>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col justify-center gap-4">
            <VStack gap={1}>
              <Text type="body" weight="semibold">USB setup</Text>
              <Text type="body" color="secondary">
                Attach a device by cable, then enable its wireless listener.
              </Text>
            </VStack>
            <Button
              label="Activate TCP/IP"
              icon={<IconUsb size={18} stroke={1.5} />}
              variant="secondary"
              size="lg"
              isLoading={enabling}
              isDisabled={!hasUsbDevice}
              onClick={handleEnable}
            />
          </div>

          <VStack gap={3}>
            {history.length > 0 && (
              // shortcut: native select, Astryx Selector uses popover positioning that is unreliable in WebKitGTK.
              <select
                aria-label="Saved wireless devices"
                value={selectedAddress}
                onChange={(event) => loadSaved(event.target.value)}
                disabled={busy}
                className="h-9 w-full rounded-lg bg-[var(--color-surface-inset)] px-2 text-[14px] text-[var(--color-text-primary)] outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                <option value="">Saved devices</option>
                {history.map((entry) => (
                  <option key={entry.address} value={entry.address}>
                    {entry.name} ({entry.address})
                  </option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
              <TextInput
                label="Device IP"
                placeholder="Device IP (e.g. 192.168.1.5)"
                value={ip}
                onChange={(value) => {
                  setIp(value)
                  setSelectedAddress('')
                }}
                isDisabled={busy}
                size="lg"
              />
              <TextInput
                label="Port"
                placeholder="Port"
                value={port}
                onChange={setPort}
                isDisabled={busy}
                size="lg"
              />
              <div className="sm:col-span-2">
                <TextInput
                  label="Name"
                  placeholder="Device name (optional)"
                  value={deviceName}
                  onChange={setDeviceName}
                  isDisabled={busy}
                  size="lg"
                />
              </div>
            </div>
            <HStack gap={2} className="justify-end">
              <Button
                label="Connect IP"
                icon={<IconWifi size={16} stroke={1.75} />}
                variant="primary"
                isLoading={connecting}
                isDisabled={busy || !ip}
                onClick={handleConnect}
              />
              <Button
                label="Disconnect"
                icon={<IconPlugConnected size={16} stroke={1.75} />}
                variant="secondary"
                isLoading={disconnecting}
                isDisabled={busy || !ip}
                onClick={handleDisconnect}
              />
            </HStack>
          </VStack>
        </div>
      </VStack>
    </div>
  )
}
