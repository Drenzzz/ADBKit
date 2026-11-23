import { useState } from 'react'
import {
  IconRotate as RotateCw,
  IconShield as Shield,
  IconPower as Power,
} from "@tabler/icons-react"
import { Button } from '@astryxdesign/core/Button'
import { rebootDevice } from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { toast } from '@/lib/toast'

const REBOOT_MODES = [
  { mode: 'system', label: 'Reboot', icon: RotateCw, variant: 'primary' as const },
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
    <section className="m3-surface rounded-3xl p-5">
      <h3 className="mb-4 flex items-center gap-2.5 text-[18px] font-semibold text-[var(--color-text-primary)]">
        Reboot Actions
      </h3>
      {!activeSerial ? (
        <p className="text-[14px] text-muted-foreground">Select a device first.</p>
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
                    isDisabled={rebooting !== null}
                    isLoading={rebooting === mode}
                    label={`Confirm ${label}`}
                  />
                  <Button size="sm" variant="ghost" onClick={() => setConfirmMode(null)} isDisabled={rebooting !== null} label="Cancel" />
                </div>
              ) : (
                <Button
                  size="sm"
                  variant={variant}
                  onClick={() => setConfirmMode(mode)}
                  isDisabled={rebooting !== null}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  label={label}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}