import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DebloaterView } from '../DebloaterView'
import type { DebloatPreset, DebloatScanItem } from '@/lib/types'

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 82,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        start: index * 82,
        size: 82,
      })),
  }),
}))

const sampleItems: DebloatScanItem[] = [
  {
    packageName: 'com.miui.msa.global',
    appName: 'MSA (MIUI System Ads)',
    vendor: 'xiaomi',
    category: 'Ads & Telemetry',
    risk: 'safe',
    description: 'Primary MIUI system ad service.',
    legacy: false,
    aospReused: false,
    autoEnableWarning: false,
    source: 'builtin',
    isEnabled: true,
    isSystemApp: true,
  },
  {
    packageName: 'com.booking',
    appName: 'Booking.com',
    vendor: 'third-party',
    category: 'Partner Preloads',
    risk: 'safe',
    description: 'Preinstalled Booking.com travel app.',
    legacy: false,
    aospReused: false,
    autoEnableWarning: false,
    source: 'builtin',
    isEnabled: true,
    isSystemApp: false,
  },
]

const samplePresets: DebloatPreset[] = [
  {
    id: 'xiaomi-ads',
    name: 'Xiaomi Ads & Telemetry',
    description: 'Safe Xiaomi ad services',
    vendor: 'xiaomi',
    packageNames: ['com.miui.msa.global'],
  },
]

describe('DebloaterView', () => {
  it('renders installed candidates with System/User and Safe/Caution badges and triggers preset', () => {
    const onApplyPreset = vi.fn()
    const onToggleSelect = vi.fn()

    render(
      <DebloaterView
        items={sampleItems}
        presets={samplePresets}
        selectedPackages={[]}
        loading={false}
        busyAction={null}
        searchTerm=""
        onToggleSelect={onToggleSelect}
        onToggleAll={vi.fn()}
        onApplyPreset={onApplyPreset}
        onDebloat={vi.fn()}
        onDisable={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    )

    expect(screen.getByText('MSA (MIUI System Ads)')).toBeInTheDocument()
    expect(screen.getByText('Booking.com')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Xiaomi Ads & Telemetry (1)' }))
    expect(onApplyPreset).toHaveBeenCalledWith('xiaomi-ads')

    fireEvent.click(screen.getByText('Booking.com'))
    expect(onToggleSelect).toHaveBeenCalledWith('com.booking')
  })

  it('shows floating action bar when packages are selected', () => {
    const onDebloat = vi.fn()
    render(
      <DebloaterView
        items={sampleItems}
        presets={samplePresets}
        selectedPackages={['com.miui.msa.global']}
        loading={false}
        busyAction={null}
        searchTerm=""
        onToggleSelect={vi.fn()}
        onToggleAll={vi.fn()}
        onApplyPreset={vi.fn()}
        onDebloat={onDebloat}
        onDisable={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    )

    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Debloat (--user 0)' }))
    expect(onDebloat).toHaveBeenCalledTimes(1)
  })
})
