import {
  IconDeviceMobile as Smartphone,
  IconBolt as Zap,
  IconHelp as HelpCircle
} from "@tabler/icons-react"
import { Badge } from '@astryxdesign/core/Badge'
import { useDevices } from '@/hooks/useDevices'
import type { DeviceMode } from '@/lib/types'

const MODE_CONFIG: Record<DeviceMode, { label: string; variant: 'purple' | 'warning' | 'neutral'; icon: typeof Smartphone }> = {
  adb: { label: 'ADB', variant: 'purple', icon: Smartphone },
  fastboot: { label: 'Fastboot', variant: 'warning', icon: Zap },
  unknown: { label: 'No Device', variant: 'neutral', icon: HelpCircle },
}

export function DeviceModeBadge() {
  const { deviceMode } = useDevices()
  const config = MODE_CONFIG[deviceMode ?? 'unknown']
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      label={config.label}
      icon={<Icon size={14} stroke={1.75} />}
    />
  )
}