import { useState } from 'react'
import {
  IconRotate as RotateCw,
  IconShield as Shield,
  IconPower as Power,
  IconRefresh as RefreshCw,
  IconArrowRight as ArrowRight,
  IconWifiOff as WifiOff,
  IconCamera as Camera,
} from "@tabler/icons-react"
import { Button } from '@astryxdesign/core/Button'
import { rebootDevice, disconnectWireless, takeDeviceScreenshot } from '@/services/deviceService'
import { selectSaveFile } from '@/services/fileService'
import { useDevices } from '@/hooks/useDevices'
import { toast } from '@/lib/toast'
import type { DeviceState } from '@/lib/types'

interface RebootOption {
  mode: string
  label: string
  icon: typeof RotateCw
  variant: 'primary' | 'secondary' | 'destructive' | 'ghost'
}

const ONLINE_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Reboot System', icon: RotateCw, variant: 'secondary' },
  { mode: 'bootloader', label: 'Bootloader', icon: Shield, variant: 'secondary' },
  { mode: 'recovery', label: 'Recovery', icon: Power, variant: 'secondary' },
  { mode: 'fastboot', label: 'Reboot Fastbootd', icon: RotateCw, variant: 'secondary' },
]

const FASTBOOT_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Reboot to System', icon: ArrowRight, variant: 'secondary' },
  { mode: 'bootloader', label: 'Reboot Bootloader', icon: Shield, variant: 'secondary' },
  { mode: 'recovery', label: 'Recovery', icon: Power, variant: 'secondary' },
  { mode: 'fastboot', label: 'Reboot Fastbootd', icon: RotateCw, variant: 'secondary' },
]

const RECOVERY_OPTIONS: RebootOption[] = [
  { mode: 'system', label: 'Exit to System', icon: ArrowRight, variant: 'secondary' },
  { mode: 'bootloader', label: 'Bootloader', icon: Shield, variant: 'secondary' },
  { mode: 'recovery', label: 'Recovery', icon: Power, variant: 'secondary' },
  { mode: 'fastboot', label: 'Reboot Fastbootd', icon: RotateCw, variant: 'secondary' },
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
  const [screenshotting, setScreenshotting] = useState(false)

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

    const handleScreenshot = async () => {
    if (!activeSerial) return
    const outputPath = await selectSaveFile(`screenshot-${Date.now()}.png`)
    if (!outputPath.trim()) return
    setScreenshotting(true)
    try {
      const message = await takeDeviceScreenshot(activeSerial, outputPath)
      toast.success('Screenshot saved', { description: message })
    } catch (e) {
      toast.error('Screenshot failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setScreenshotting(false)
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
    <section className="m3-surface rounded-3xl p-5 border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[var(--color-text-primary)]">
          Device actions
        </h3>
        {activeSerial && (
          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[14px] font-semibold">
            {stateLabel}
          </span>
        )}
      </div>
      {!activeSerial ? (
        <p className="text-[14px] text-muted-foreground">Select a device from the sidebar to execute actions.</p>
      ) : state === 'offline' || state === 'unauthorized' ? (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            {state === 'unauthorized'
              ? 'Device is unauthorized. Please verify the USB debugging prompt on your phone screen.'
              : 'Device is offline. Check the hardware connection or USB cable.'}
          </p>
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-[14px] font-medium"
              onClick={refreshDevices}
              isDisabled={refreshing}
              icon={<RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />}
              label="Retry Connection"
            />
          </div>
        </div>
      ) : options.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">No operations available for the current device state.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(({ mode, label, icon: Icon, variant }) => (
            <div key={mode}>
              {confirmMode === mode ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 text-[14px] font-medium"
                    onClick={() => handleReboot(mode)}
                    isDisabled={rebooting !== null}
                    isLoading={rebooting === mode}
                    label={`Confirm ${label}`}
                  />
                  <Button size="sm" variant="ghost" className="h-8 text-[14px] font-medium" onClick={() => setConfirmMode(null)} isDisabled={rebooting !== null} label="Cancel" />
                </div>
              ) : (
                <Button
                  size="sm"
                  variant={variant}
                  className="h-8 text-[14px] font-medium"
                  onClick={() => setConfirmMode(mode)}
                  isDisabled={rebooting !== null}
                  icon={<Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                  label={label}
                />
              )}
            </div>
          ))}

          {state === 'device' && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-[14px] font-medium"
              onClick={handleScreenshot}
              isDisabled={screenshotting || rebooting !== null}
              isLoading={screenshotting}
              icon={<Camera className="h-3.5 w-3.5 text-muted-foreground" />}
              label="Screenshot"
            />
          )}

          {isWirelessDevice && (
            <div>
              {confirmMode === 'forget' ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 text-[14px] font-medium"
                    onClick={handleForget}
                    isDisabled={rebooting !== null}
                    label="Confirm Disconnect"
                  />
                  <Button size="sm" variant="ghost" className="h-8 text-[14px] font-medium" onClick={() => setConfirmMode(null)} isDisabled={rebooting !== null} label="Cancel" />
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-[14px] font-medium"
                  onClick={() => setConfirmMode('forget')}
                  isDisabled={rebooting !== null}
                  icon={<WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  label="Disconnect"
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
