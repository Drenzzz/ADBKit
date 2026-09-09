import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WirelessConnectCard } from '../WirelessConnectCard'

const mocks = vi.hoisted(() => ({
  connectWireless: vi.fn().mockResolvedValue('connected'),
  enableWirelessTCPIP: vi.fn().mockResolvedValue('tcpip'),
  disconnectWireless: vi.fn().mockResolvedValue('disconnected'),
  getWirelessHistory: vi.fn().mockResolvedValue([]),
  saveWirelessHistory: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/deviceService', () => mocks)

describe('WirelessConnectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getWirelessHistory.mockResolvedValue([])
    mocks.saveWirelessHistory.mockResolvedValue(undefined)
  })

  it('loads a saved device into the connector fields', async () => {
    mocks.getWirelessHistory.mockResolvedValueOnce([
      { address: '192.168.1.5:5555', name: 'Pixel' },
    ])
    render(<WirelessConnectCard />)

    const history = await screen.findByRole('combobox', { name: 'Saved wireless devices' })
    fireEvent.change(history, { target: { value: '192.168.1.5:5555' } })

    expect(screen.getByPlaceholderText('Device IP (e.g. 192.168.1.5)')).toHaveValue('192.168.1.5')
    expect(screen.getByPlaceholderText('Port')).toHaveValue('5555')
    expect(screen.getByPlaceholderText('Device name (optional)')).toHaveValue('Pixel')
  })

  it('saves a named device after a successful connection', async () => {
    render(<WirelessConnectCard />)
    fireEvent.change(screen.getByPlaceholderText('Device IP (e.g. 192.168.1.5)'), {
      target: { value: '192.168.1.5' },
    })
    fireEvent.change(screen.getByPlaceholderText('Device name (optional)'), {
      target: { value: 'Pixel' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Connect IP' }))

    await waitFor(() => {
      expect(mocks.saveWirelessHistory).toHaveBeenCalledWith([
        { address: '192.168.1.5:5555', name: 'Pixel' },
      ])
    })
  })
})
