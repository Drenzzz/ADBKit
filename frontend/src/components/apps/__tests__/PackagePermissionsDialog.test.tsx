import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockReport = {
  packageName: 'com.example.app',
  permissions: [
    { name: 'android.permission.CAMERA', label: 'Camera', group: 'Camera', isRuntime: true, isGranted: true },
    { name: 'android.permission.ACCESS_FINE_LOCATION', label: 'Fine location', group: 'Location', isRuntime: true, isGranted: false },
    { name: 'android.permission.INTERNET', label: 'Internet', group: 'Other', isRuntime: false, isGranted: true },
  ],
  appOps: [
    { name: 'CAMERA', label: 'Camera', mode: 'allow' },
    { name: 'SYSTEM_ALERT_WINDOW', label: 'Draw over other apps', mode: 'deny' },
  ],
  appOpsSupported: true,
}

const getPermissions = vi.fn()
const setPerm = vi.fn()
const setOp = vi.fn()

vi.mock('@/services/packageService', () => ({
  getPackagePermissions: (...args: unknown[]) => getPermissions(...args),
  setPackagePermission: (...args: unknown[]) => setPerm(...args),
  setPackageAppOp: (...args: unknown[]) => setOp(...args),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

import { PackagePermissionsDialog } from '../PackagePermissionsDialog'

describe('PackagePermissionsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPermissions.mockResolvedValue(mockReport)
    setPerm.mockResolvedValue('Granted CAMERA')
    setOp.mockResolvedValue('Set CAMERA to deny')
  })

  it('renders runtime permissions grouped after fetch', async () => {
    render(<PackagePermissionsDialog open={true} onOpenChange={vi.fn()} packageName="com.example.app" />)
    await waitFor(() => expect(getPermissions).toHaveBeenCalledWith('com.example.app'))
    expect(await screen.findByText('Fine location')).toBeInTheDocument()
    // Camera appears at least once
    expect(screen.getAllByText('Camera').length).toBeGreaterThan(0)
  })

  it('toggles permission via service', async () => {
    render(<PackagePermissionsDialog open={true} onOpenChange={vi.fn()} packageName="com.example.app" />)
    await waitFor(() => expect(getPermissions).toHaveBeenCalled())
    // Find the Camera permission row and click its switch -> the Switch component uses role switch/checkbox
    // We look for the Camera row then its switch input
    const switches = await screen.findAllByLabelText(/permission/i)
    // First switch corresponds to Camera (granted true)
    expect(switches.length).toBeGreaterThan(0)
    fireEvent.click(switches[0])
    await waitFor(() => expect(setPerm).toHaveBeenCalled())
  })

  it('sets appop mode via service when switching tab', async () => {
    render(<PackagePermissionsDialog open={true} onOpenChange={vi.fn()} packageName="com.example.app" />)
    await waitFor(() => expect(getPermissions).toHaveBeenCalled())

    const appOpsTab = screen.getByRole('button', { name: /App ops/i })
    fireEvent.click(appOpsTab)
    const denyBtn = await screen.findByText('Draw over other apps')
    expect(denyBtn).toBeInTheDocument()

    // Find allow button for SYSTEM_ALERT_WINDOW (currently deny, so allow should be inactive and clickable)
    const allowButtons = screen.getAllByRole('button', { name: 'allow' })
    // click first allow (for CAMERA currently allow -> would be active, not trigger; so pick second)
    fireEvent.click(allowButtons[1])
    await waitFor(() => expect(setOp).toHaveBeenCalled())
  })

  it('filters by search query', async () => {
    render(<PackagePermissionsDialog open={true} onOpenChange={vi.fn()} packageName="com.example.app" />)
    await waitFor(() => expect(getPermissions).toHaveBeenCalled())
    const search = screen.getByPlaceholderText(/Search permissions/i)
    fireEvent.change(search, { target: { value: 'camera' } })
    await waitFor(() => {
      // still has Camera group visible, but Fine location filtered out
      expect(screen.getAllByText('Camera').length).toBeGreaterThan(0)
      expect(screen.queryByText('Fine location')).not.toBeInTheDocument()
    })
  })
})
