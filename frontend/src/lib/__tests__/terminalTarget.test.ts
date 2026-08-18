import { describe, expect, it } from 'vitest'
import { getTerminalTargetSerial } from '@/lib/terminalTarget'
import type { DeviceSummary } from '@/lib/types'

const devices: DeviceSummary[] = [
  { serial: 'ADB-001', state: 'device', mode: 'adb' },
  { serial: 'FB-001', state: 'fastboot', mode: 'fastboot' },
]

describe('getTerminalTargetSerial', () => {
  it('uses the active Fastboot device when selected', () => {
    expect(getTerminalTargetSerial('fastboot-host', 'FB-001', devices)).toBe('FB-001')
  })

  it('falls back to a connected Fastboot device', () => {
    expect(getTerminalTargetSerial('fastboot-host', 'ADB-001', devices)).toBe('FB-001')
  })

  it('keeps the active serial for ADB modes', () => {
    expect(getTerminalTargetSerial('adb-shell', 'ADB-001', devices)).toBe('ADB-001')
  })

  it('returns empty when Fastboot has no target', () => {
    expect(getTerminalTargetSerial('fastboot-host', '', devices.slice(0, 1))).toBe('')
  })
})
