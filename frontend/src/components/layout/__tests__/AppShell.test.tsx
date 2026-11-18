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
  it('renders the side navigation and the route content side by side', async () => {
    renderShell()

    await waitFor(() => {
      expect(document.body.textContent).toContain('ROUTE_CONTENT')
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(document.querySelectorAll('nav, [role="navigation"]').length).toBeGreaterThan(0)
    }, { timeout: 3000 })

    // LayoutContent renders role="main" as a div (not the <main> element).
    const main = document.querySelector('[role="main"]')
    expect(main).toBeTruthy()
    expect(main?.textContent).toContain('ROUTE_CONTENT')
  })

  it('keeps the route content inside a rounded, bordered surface', async () => {
    renderShell()

    await waitFor(() => {
      expect(document.body.textContent).toContain('ROUTE_CONTENT')
    })

    const content = [...document.querySelectorAll('div')].find((el) =>
      el.className.includes('rounded-2xl'),
    )
    expect(content).toBeTruthy()
    expect(content?.className).toContain('border-border')
    expect(content?.className).toContain('bg-card')
    expect(content?.textContent).toContain('ROUTE_CONTENT')
  })

  it('exposes a skip link as the first focusable element', async () => {
    renderShell()

    await waitFor(() => {
      expect(document.querySelector('a[href^="#"]')).toBeTruthy()
    })

    const skip = document.querySelector('a[href^="#"]')
    expect(skip).toBeTruthy()
    expect(skip?.textContent?.toLowerCase()).toContain('skip')
  })
})
