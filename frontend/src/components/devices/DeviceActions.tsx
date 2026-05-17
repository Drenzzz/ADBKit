import { useState } from 'react'
import { RotateCw, Shield, Power, RefreshCw, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { rebootDevice } from '@/services/deviceService'
import { useDevices } from '@/hooks/useDevices'
import { toast } from 'sonner'
import type { DeviceState } from '@/lib/types'

interface RebootOption {
  mode: string
  label: string
  icon: typeof RotateCw
  variant: 'default' | 'secondary' | 'destructive'
}

const ONLINE_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Reboot', icon: RotateCw, variant: 'default' },
  { mode: 'bootloader', label: 'Bootloader', icon: Shield, variant: 'secondary' },
  { mode: 'recovery', label: 'Recovery', icon: Power, variant: 'secondary' },
]

const FASTBOOT_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Reboot to System', icon: ArrowRight, variant: 'default' },
  { mode: 'bootloader', label: 'Reboot Bootloader', icon: Shield, variant: 'secondary' },
  { mode: 'recovery', label: 'Recovery', icon: Power, variant: 'secondary' },
  { mode: 'fastboot', label: 'Reboot Fastbootd', icon: RotateCw, variant: 'secondary' },
]

const RECOVERY_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Exit to System', icon: ArrowRight, variant: 'default' },
]

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

  const handleReboot = async (mode: string) => {
    if (!activeSerial) return
    setRebooting(mode)
    try {
      const message = await rebootDevice(activeSerial, mode)
      toast.success('Reboot command sent', { description: message })
    } catch (e) {
      toast.error('Reboot failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setRebooting(null)
      setConfirmMode(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Device Actions</CardTitle>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {stateLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!activeSerial ? (
          <p className="text-sm text-muted-foreground">Select a device first.</p>
        ) : state === 'offline' || state === 'unauthorized' ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              {state === 'unauthorized'
                ? 'Device is not authorized. Check the device screen to allow USB debugging.'
                : 'Device is offline. Check the connection and try again.'}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={refreshDevices} disabled={refreshing}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </div>
        ) : options.length === 0 ? (
          <p className="text-sm text-muted-foreground">No actions available for this device state.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map(({ mode, label, icon: Icon, variant }) => (
              <div key={mode}>
                {confirmMode === mode ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReboot(mode)}
                      disabled={rebooting !== null}
                    >
                      {rebooting === mode ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                      Confirm {label}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmMode(null)} disabled={rebooting !== null}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={variant}
                    onClick={() => setConfirmMode(mode)}
                    disabled={rebooting !== null}
                  >
                    <Icon className="mr-1.5 h-3.5 w-3.5" />
                    {label}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
