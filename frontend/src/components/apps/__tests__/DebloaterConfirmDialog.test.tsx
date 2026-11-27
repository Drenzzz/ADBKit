import { render, screen, fireEvent } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { DebloaterConfirmDialog } from '../DebloaterConfirmDialog'
import type { DebloatScanItem } from '@/lib/types'

beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '')
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open')
    }
  }
})

const safeItem: DebloatScanItem = {
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
}

const cautionAutoEnableItem: DebloatScanItem = {
  packageName: 'com.miui.contentcatcher',
  appName: 'Content Catcher',
  vendor: 'xiaomi',
  category: 'Ads & Telemetry',
  risk: 'caution',
  description: 'Screen-content indexing helper.',
  legacy: false,
  aospReused: false,
  autoEnableWarning: true,
  source: 'builtin',
  isEnabled: true,
  isSystemApp: true,
}

describe('DebloaterConfirmDialog', () => {
  it('allows direct confirmation for safe-only selections and clears data without -k', () => {
    const onConfirm = vi.fn()
    render(
      <DebloaterConfirmDialog
        open
        onOpenChange={vi.fn()}
        action="debloat"
        items={[safeItem]}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText(/pm uninstall --user 0 com\.miui\.msa\.global/)).toBeInTheDocument()
    expect(screen.queryByText(/Keep app data/)).not.toBeInTheDocument()
    const confirmBtn = screen.getByRole('button', { name: 'Debloat (--user 0)' })
    expect(confirmBtn).not.toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('requires explicit acknowledgement checkbox when caution packages are selected', () => {
    const onConfirm = vi.fn()
    render(
      <DebloaterConfirmDialog
        open
        onOpenChange={vi.fn()}
        action="debloat"
        items={[safeItem, cautionAutoEnableItem]}
        onConfirm={onConfirm}
      />,
    )

    const confirmBtn = screen.getByRole('button', { name: 'Debloat (--user 0)' })
    expect(confirmBtn).toHaveAttribute('aria-disabled', 'true')

    const checkbox = screen.getByRole('checkbox', {
      name: /I understand the risks for these caution packages/i,
    })
    fireEvent.click(checkbox)
    expect(confirmBtn).not.toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('shows MIUI auto-re-enable warning when disabling flagged packages', () => {
    render(
      <DebloaterConfirmDialog
        open
        onOpenChange={vi.fn()}
        action="disable"
        items={[cautionAutoEnableItem]}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('MIUI auto-re-enable warning')).toBeInTheDocument()
    expect(screen.getByText(/pm disable-user --user 0 com\.miui\.contentcatcher/)).toBeInTheDocument()
  })
})
