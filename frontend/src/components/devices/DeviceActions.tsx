import { useState } from 'react'
import { RotateCw, Shield, Power, RefreshCw, ArrowRight, Loader2, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { rebootDevice, disconnectWireless } from '@/services/deviceService'
import { useDevices } from '@/hooks/useDevices'
import { toast } from 'sonner'
import type { DeviceState } from '@/lib/types'

interface RebootOption {
  mode: string
  label: string
  icon: typeof RotateCw
  variant: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
}

const ONLINE_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Reboot System', icon: RotateCw, variant: 'outline' },
  { mode: 'bootloader', label: 'Bootloader', icon: Shield, variant: 'outline' },
  { mode: 'recovery', label: 'Recovery', icon: Power, variant: 'outline' },
  { mode: 'fastboot', label: 'Reboot Fastbootd', icon: RotateCw, variant: 'outline' },
]

const FASTBOOT_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Reboot to System', icon: ArrowRight, variant: 'outline' },
  { mode: 'bootloader', label: 'Reboot Bootloader', icon: Shield, variant: 'outline' },
  { mode: 'recovery', label: 'Recovery', icon: Power, variant: 'outline' },
  { mode: 'fastboot', label: 'Reboot Fastbootd', icon: RotateCw, variant: 'outline' },
]

const RECOVERY_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Exit to System', icon: ArrowRight, variant: 'outline' },
]

function isWireless(serial: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(serial)
}

function getOptionsForState(state: DeviceState): RebootOption[] {
  switch (state) {
    case 'device':
      return ONLINE_OPTIONS
    case 'fastboot':
      return FASTBOOT_OPTIONS
    case 'recovery':
    case 'sideload':
      return RECOVERY_OPTIONS
    default:
      return []
  }
}

function getStateLabel(state: DeviceState): string {
  switch (state) {
    case 'device': return 'Online'
    case 'offline': return 'Offline'
    case 'unauthorized': return 'Unauthorized'
    case 'recovery': return 'Recovery'
    case 'sideload': return 'Sideload'
    case 'fastboot': return 'Fastboot'
    default: return 'Unknown'
  }
}

export function DeviceActions() {
  const { activeSerial, deviceInfo, refreshing, refreshDevices } = useDevices()
  const [rebooting, setRebooting] = useState<string | null>(null)
  const [confirmMode, setConfirmMode] = useState<string | null>(null)

  const state = deviceInfo?.state ?? 'unknown'
  const options = getOptionsForState(state)
  const stateLabel = getStateLabel(state)
  const isWirelessDevice = activeSerial ? isWireless(activeSerial) : false

  const handleReboot = async (mode: string) => {
    if (!activeSerial) return
    setRebooting(mode)
    try {
      const message = await rebootDevice(activeSerial, mode)
      toast.success('Reboot command executed', { description: message })
    } catch (e) {
      toast.error('Reboot failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setRebooting(null)
      setConfirmMode(null)
    }
  }

  const handleForget = async () => {
    if (!activeSerial) return
    try {
      const message = await disconnectWireless(activeSerial)
      toast.success('Device disconnected', { description: message })
      refreshDevices()
    } catch (e) {
      toast.error('Disconnection failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return (
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Device Actions
        </CardTitle>
        {activeSerial && (
          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
            {stateLabel}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!activeSerial ? (
          <p className="text-xs text-muted-foreground">Select a device from the sidebar to execute actions.</p>
        ) : state === 'offline' || state === 'unauthorized' ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {state === 'unauthorized'
                ? 'Device is unauthorized. Please verify the USB debugging prompt on your phone screen.'
                : 'Device is offline. Check the hardware connection or USB cable.'}
            </p>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="outline" className="h-8 text-xs font-medium" onClick={refreshDevices} disabled={refreshing}>
                <RefreshCw className={`mr-1.5 h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                Retry Connection
              </Button>
            </div>
          </div>
        ) : options.length === 0 ? (
          <p className="text-xs text-muted-foreground">No operations available for the current device state.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map(({ mode, label, icon: Icon, variant }) => (
              <div key={mode}>
                {confirmMode === mode ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs font-medium"
                      onClick={() => handleReboot(mode)}
                      disabled={rebooting !== null}
                    >
                      {rebooting === mode ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                      Confirm {label}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs font-medium" onClick={() => setConfirmMode(null)} disabled={rebooting !== null}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={variant}
                    className="h-8 text-xs font-medium"
                    onClick={() => setConfirmMode(mode)}
                    disabled={rebooting !== null}
                  >
                    <Icon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    {label}
                  </Button>
                )}
              </div>
            ))}

            {isWirelessDevice && (
              <div>
                {confirmMode === 'forget' ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs font-medium"
                      onClick={handleForget}
                      disabled={rebooting !== null}
                    >
                      Confirm Disconnect
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs font-medium" onClick={() => setConfirmMode(null)} disabled={rebooting !== null}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium"
                    onClick={() => setConfirmMode('forget')}
                    disabled={rebooting !== null}
                  >
                    <WifiOff className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    Disconnect
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
