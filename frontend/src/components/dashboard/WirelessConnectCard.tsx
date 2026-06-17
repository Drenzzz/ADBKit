import { useState } from 'react'
import { Wifi, Usb, PlugZap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { connectWireless, enableWirelessTCPIP, disconnectWireless } from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { toast } from 'sonner'

export function WirelessConnectCard() {
  const { devices } = useDeviceStore()
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('5555')
  const [isEnabling, setIsEnabling] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const hasUsbDevice = devices.some((d) => d.mode === 'adb' && d.state === 'device')

  const handleEnableTCPIP = async () => {
    setIsEnabling(true)
    try {
      const message = await enableWirelessTCPIP(port)
      toast.success('Wireless TCP/IP mode enabled', { description: message })
    } catch (e) {
      toast.error('Failed to enable wireless mode', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setIsEnabling(false)
    }
  }

  const handleConnect = async () => {
    if (!ip) {
      toast.error('IP address is required')
      return
    }
    setIsConnecting(true)
    try {
      const address = `${ip}:${port}`
      const message = await connectWireless(address)
      toast.success('Wireless ADB connected successfully', { description: message })
    } catch (e) {
      toast.error('Wireless connection failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!ip) {
      toast.error('IP address is required')
      return
    }
    setIsDisconnecting(true)
    try {
      const address = `${ip}:${port}`
      const message = await disconnectWireless(address)
      toast.success('Wireless ADB disconnected', { description: message })
    } catch (e) {
      toast.error('Disconnection failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          <Wifi className="h-3.5 w-3.5" />
          Wireless Terminal Connector
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/40">
          {/* Column 1: TCP/IP Activator */}
          <div className="flex flex-col gap-2.5 pb-4 md:pb-0 md:pr-6 justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                1. USB Activator
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your device via USB cable first, then activate TCP/IP wireless listener mode.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium w-full mt-2"
              onClick={handleEnableTCPIP}
              disabled={isEnabling || !hasUsbDevice}
            >
              {isEnabling ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Usb className="mr-1.5 h-3.5 w-3.5" />
              )}
              Activate TCP/IP Mode
            </Button>
          </div>

          {/* Column 2: IP Linker */}
          <div className="flex flex-col gap-2.5 pt-4 md:pt-0 md:pl-6 justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                2. Wireless Linker
              </span>
              <div className="flex gap-2">
                <Input
                  placeholder="Device IP (e.g. 192.168.1.5)"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  disabled={isConnecting || isDisconnecting}
                  className="h-8 text-xs flex-1"
                />
                <Input
                  placeholder="Port"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  disabled={isConnecting || isDisconnecting}
                  className="h-8 text-xs w-16"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={handleConnect}
                disabled={isConnecting || !ip || isDisconnecting}
              >
                {isConnecting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wifi className="mr-1.5 h-3.5 w-3.5" />
                )}
                Connect IP
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium"
                onClick={handleDisconnect}
                disabled={isDisconnecting || !ip || isConnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlugZap className="mr-1.5 h-3.5 w-3.5" />
                )}
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
