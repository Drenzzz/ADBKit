import { useState } from 'react'
import { RotateCw, Shield, Power, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { rebootDevice } from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { toast } from 'sonner'

const REBOOT_MODES = [
  { mode: 'system', label: 'Reboot', icon: RotateCw, variant: 'default' as const },
  { mode: 'bootloader', label: 'Bootloader', icon: Shield, variant: 'secondary' as const },
  { mode: 'recovery', label: 'Recovery', icon: Power, variant: 'secondary' as const },
]

export function RebootActions() {
  const { activeSerial } = useDeviceStore()
  const [rebooting, setRebooting] = useState<string | null>(null)
  const [confirmMode, setConfirmMode] = useState<string | null>(null)

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
        <CardTitle className="text-sm font-semibold">Reboot Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {!activeSerial ? (
          <p className="text-sm text-muted-foreground">Select a device first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {REBOOT_MODES.map(({ mode, label, icon: Icon, variant }) => (
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
