import { describe, it, expect, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { Theme } from '@astryxdesign/core/theme'
import { themes, defaultThemeSlug } from '@/astryx-themes'
import { AppShell } from '../AppShell'
import { renderRoute } from '@/test-utils'

vi.mock('@/services/binaryService', () => ({
  getSetupState: vi.fn().mockResolvedValue({ setupCompleted: true, canFinish: true }),
}))

vi.mock('@/services/settingsService', () => ({
  getAppConfig: vi.fn().mockResolvedValue({ theme: 'dark' }),
  updatePreferences: vi.fn().mockResolvedValue({ theme: 'dark' }),
  getWindowState: vi.fn().mockResolvedValue('maximised'),
  setWindowState: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/hooks/useDeviceSync', () => ({
  useDeviceSync: vi.fn(),
}))

function renderShell() {
  return renderRoute(
    <Theme theme={themes[defaultThemeSlug]} mode="dark">
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div>ROUTE_CONTENT</div>} />
        </Route>
      </Routes>
    </Theme>,
    '/',
  )
}

describe('AppShell', () => {
  it('renders the rail navigation beside the route content', async () => {
    renderShell()

    await waitFor(() => {
      expect(document.body.textContent).toContain('ROUTE_CONTENT')
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(document.querySelector('aside[role="navigation"]')).toBeTruthy()
    }, { timeout: 3000 })

    // The rail and the content region are siblings in a flex row — the rail
    // must not overlap the content.
    const rail = document.querySelector('aside[role="navigation"]') as HTMLElement
    expect(rail.className).toContain('shrink-0')

    const main = document.querySelector('main')
    expect(main).toBeTruthy()
  })

  it('keeps the route content inside a rounded, bordered surface', async () => {
    renderShell()

    await waitFor(() => {
      expect(document.body.textContent).toContain('ROUTE_CONTENT')
    }, { timeout: 3000 })

    const content = [...document.querySelectorAll('div')].find((el) =>
      el.className.includes('rounded-2xl'),
    )
    expect(content).toBeTruthy()
    expect(content?.className).toContain('border-border')
    expect(content?.className).toContain('bg-card')
    expect(content?.textContent).toContain('ROUTE_CONTENT')
  })

  it('renders rail buttons for every route', async () => {
    renderShell()

    await waitFor(() => {
      expect(document.querySelectorAll('aside[role="navigation"] button').length).toBeGreaterThanOrEqual(8)
    }, { timeout: 3000 })
  })
})
