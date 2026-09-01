import { useState } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { toast } from 'sonner'
import {
  IconDeviceMobile as Smartphone,
  IconStack2 as Layers,
  IconHash as Hash,
  IconShield as Shield,
  IconCpu as Cpu,
  IconBuildingFactory as Factory,
  IconKey as KeyRound,
  IconWifi as Wifi,
  IconBattery as Battery,
  IconDeviceUsb as HardDrive,
  IconDeviceSdCard as MemoryStick,
  IconTag as Tag,
  IconInfoCircle as Info,
  IconPlugConnected as Cable,
  IconCheck as Check,
  IconCopy as Copy,
  IconRefresh as RefreshCw
} from "@tabler/icons-react"
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDevices } from '@/hooks/useDevices'
import type { DeviceInfo } from '@/lib/types'

interface InfoCell {
  label: string
  value: string
  icon: React.ElementType
  mono?: boolean
}

function isWireless(serial: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(serial)
}

function buildCells(deviceInfo: DeviceInfo): InfoCell[] {
  const cells: InfoCell[] = []

  if (deviceInfo.model) cells.push({ label: 'Model', value: deviceInfo.model, icon: Smartphone })
  if (deviceInfo.brand) cells.push({ label: 'Brand', value: deviceInfo.brand, icon: Tag })
  if (deviceInfo.manufacturer) cells.push({ label: 'Maker', value: deviceInfo.manufacturer, icon: Factory })
  if (deviceInfo.codename) cells.push({ label: 'Codename', value: deviceInfo.codename, icon: Info, mono: true })
  if (deviceInfo.androidVersion) cells.push({ label: 'Android', value: deviceInfo.androidVersion, icon: Smartphone })
  if (deviceInfo.sdkVersion) cells.push({ label: 'SDK', value: `API ${deviceInfo.sdkVersion}`, icon: Layers })
  if (deviceInfo.buildId) cells.push({ label: 'Build ID', value: deviceInfo.buildId, icon: Hash, mono: true })
  if (deviceInfo.securityPatch) cells.push({ label: 'Patch', value: deviceInfo.securityPatch, icon: Shield })
  if (deviceInfo.abis) cells.push({ label: 'ABI', value: deviceInfo.abis, icon: Cpu, mono: true })
  if (deviceInfo.serial) cells.push({ label: 'Serial', value: deviceInfo.serial, icon: Hash, mono: true })
  if (deviceInfo.batteryLevel) cells.push({ label: 'Battery', value: deviceInfo.batteryLevel, icon: Battery })
  if (deviceInfo.storageInfo) cells.push({ label: 'Storage', value: deviceInfo.storageInfo, icon: HardDrive, mono: true })
  if (deviceInfo.ramTotal) cells.push({ label: 'RAM', value: deviceInfo.ramTotal, icon: MemoryStick })
  if (deviceInfo.ipAddress) cells.push({ label: 'IP Address', value: deviceInfo.ipAddress, icon: Wifi, mono: true })
  if (deviceInfo.rootStatus) cells.push({ label: 'Root', value: deviceInfo.rootStatus, icon: KeyRound })
  cells.push({ label: 'Mode', value: isWireless(deviceInfo.serial) ? 'Wi-Fi' : 'USB', icon: Cable })
  if (deviceInfo.transportId) cells.push({ label: 'Transport', value: deviceInfo.transportId, icon: Hash, mono: true })
  if (deviceInfo.product) cells.push({ label: 'Product', value: deviceInfo.product, icon: Info, mono: true })
  if (deviceInfo.device) cells.push({ label: 'Device', value: deviceInfo.device, icon: Info, mono: true })
  if (deviceInfo.connectionLabel) cells.push({ label: 'Connection', value: deviceInfo.connectionLabel, icon: Wifi, mono: true })

  return cells
}

export function DeviceDetailPanel() {
  const reduced = useReducedMotion()
  const { activeSerial, deviceInfo, loading, refreshDevices } = useDevices()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const cells = deviceInfo ? buildCells(deviceInfo) : []

  async function handleCopy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(label)
      toast.success(`Copied ${label}`)
      window.setTimeout(() => setCopiedKey(null), 1200)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)] w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          <Info className="h-3.5 w-3.5" />
          Device Specifications
        </CardTitle>
        {activeSerial && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={refreshDevices}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!deviceInfo ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No active device details.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {cells.map((cell) => {
              const Icon = cell.icon
              const isCopied = copiedKey === cell.label
              return (
                <motion.button
                  key={cell.label}
                  type="button"
                  whileHover={reduced ? undefined : { scale: 1.01 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  onClick={() => handleCopy(cell.label, cell.value)}
                  className="group flex items-start gap-2.5 rounded-xl border border-border/40 bg-muted/10 p-2.5 text-left transition-colors hover:border-border/60 hover:bg-muted/20 hover:shadow-sm cursor-pointer"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40 text-muted-foreground group-hover:text-primary transition-colors">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
                        {cell.label}
                      </p>
                      <span className="flex h-3 w-3 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        {isCopied ? (
                          <Check className="h-2.5 w-2.5 text-success" />
                        ) : (
                          <Copy className="h-2.5 w-2.5 text-muted-foreground/50 group-hover:text-primary" />
                        )}
                      </span>
                    </div>
                    <p className={cn('mt-0.5 truncate text-xs font-semibold text-foreground', cell.mono && 'font-mono text-[10px]')}>
                      {cell.value}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
