import { useEffect } from 'react'
import { Smartphone, Zap, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getDeviceMode } from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'
import type { DeviceMode } from '@/lib/types'

const MODE_CONFIG: Record<DeviceMode, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Smartphone }> = {
  adb: { label: 'ADB', variant: 'default', icon: Smartphone },
  fastboot: { label: 'Fastboot', variant: 'secondary', icon: Zap },
  unknown: { label: 'No Device', variant: 'outline', icon: HelpCircle },
}

export function DeviceModeBadge() {
  const { activeSerial, deviceMode, setDeviceMode } = useDeviceStore()

  useEffect(() => {
    if (!activeSerial) {
      setDeviceMode(null)
      return
    }

    let cancelled = false
    const fetch = async () => {
      try {
        const mode = await getDeviceMode(activeSerial)
        if (!cancelled) setDeviceMode(mode)
      } catch {
        if (!cancelled) setDeviceMode('unknown')
      }
    }
    fetch()
    const interval = setInterval(fetch, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [activeSerial, setDeviceMode])

  const config = MODE_CONFIG[deviceMode ?? 'unknown']
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1 text-[10px]">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
