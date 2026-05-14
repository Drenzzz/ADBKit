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
      toast.success('Wireless mode enabled', { description: message })
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
      toast.success('Connected', { description: message })
    } catch (e) {
      toast.error('Connection failed', {
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
      toast.success('Disconnected', { description: message })
    } catch (e) {
      toast.error('Disconnect failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Wifi className="h-4 w-4" />
          Wireless ADB
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">Step 1: Enable via USB</p>
          <p className="text-xs text-muted-foreground">
            Connect device via USB cable first, then enable TCP/IP mode.
          </p>
          <Button
            size="sm"
            onClick={handleEnableTCPIP}
            disabled={isEnabling || !hasUsbDevice}
          >
            {isEnabling ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Usb className="mr-2 h-3.5 w-3.5" />}
            Enable Wireless Mode
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">Step 2: Connect via WiFi</p>
          <div className="flex gap-2">
            <Input
              placeholder="Device IP"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              disabled={isConnecting || isDisconnecting}
              className="flex-1"
            />
            <Input
              placeholder="Port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              disabled={isConnecting || isDisconnecting}
              className="w-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={isConnecting || !ip || isDisconnecting}
            >
              {isConnecting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Wifi className="mr-2 h-3.5 w-3.5" />}
              Connect
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
              disabled={isDisconnecting || !ip || isConnecting}
            >
              {isDisconnecting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <PlugZap className="mr-2 h-3.5 w-3.5" />}
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
