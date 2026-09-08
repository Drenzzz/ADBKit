import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BatchBar } from '../BatchBar'
import type { PackageBatchAction } from '@/lib/types'

describe('BatchBar', () => {
  const defaultProps = {
    count: 2,
    busyAction: null as PackageBatchAction | null,
    onUninstall: vi.fn(),
    onEnable: vi.fn(),
    onDisable: vi.fn(),
    onForceStop: vi.fn(),
    onClearData: vi.fn(),
    onExportApk: vi.fn(),
    onClear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when count > 0', () => {
    render(<BatchBar {...defaultProps} />)
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    expect(screen.getByText('Uninstall')).toBeInTheDocument()
  })

  it('does not render when count is 0', () => {
    render(<BatchBar {...defaultProps} count={0} />)
    expect(screen.queryByText('selected')).not.toBeInTheDocument()
  })

  it('disables all action buttons when busyAction is not null', () => {
    render(<BatchBar {...defaultProps} busyAction="uninstall" />)
    expect(screen.getByText('Enable').closest('button')).toBeDisabled()
    expect(screen.getByText('Disable').closest('button')).toBeDisabled()
    expect(screen.getByText('Stop').closest('button')).toBeDisabled()
    expect(screen.getByText('Clear').closest('button')).toBeDisabled()
    expect(screen.getByText('Export').closest('button')).toBeDisabled()
    expect(screen.getByText('Uninstall').closest('button')).toBeDisabled()
  })

  it('calls onUninstall when Uninstall button is clicked', () => {
    render(<BatchBar {...defaultProps} />)
    fireEvent.click(screen.getByText('Uninstall').closest('button')!)
    expect(defaultProps.onUninstall).toHaveBeenCalledTimes(1)
  })

  it('calls onEnable when Enable button is clicked', () => {
    render(<BatchBar {...defaultProps} />)
    fireEvent.click(screen.getByText('Enable').closest('button')!)
    expect(defaultProps.onEnable).toHaveBeenCalledTimes(1)
  })

  it('calls onClear when X button is clicked', () => {
    render(<BatchBar {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: '' }).closest('button')!)
    expect(defaultProps.onClear).toHaveBeenCalledTimes(1)
  })
})
