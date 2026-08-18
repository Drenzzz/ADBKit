import type { DeviceSummary, TerminalMode } from '@/lib/types'

export function getTerminalTargetSerial(
  mode: TerminalMode,
  activeSerial: string,
  devices: DeviceSummary[],
): string {
  if (mode !== 'fastboot-host') {
    return activeSerial
  }

  const activeFastboot = devices.find(
    (device) => device.serial === activeSerial && device.mode === 'fastboot',
  )
  if (activeFastboot) {
    return activeFastboot.serial
  }

  return devices.find((device) => device.mode === 'fastboot')?.serial ?? ''
}
