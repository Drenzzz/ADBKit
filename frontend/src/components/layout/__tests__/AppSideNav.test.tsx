import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { Theme } from '@astryxdesign/core/theme'
import { themes, defaultThemeSlug } from '@/astryx-themes'
import { AppSideNav } from '../AppSideNav'
import { renderRoute } from '@/test-utils'

const ROUTE_LABELS = [
  'Dashboard',
  'Devices',
  'Apps',
  'Files',
  'Flasher',
  'Terminal',
  'Scrcpy',
  'Settings',
]

function renderSideNav(initialPath: string) {
  return renderRoute(
    <Theme theme={themes[defaultThemeSlug]} mode="dark">
      <AppSideNav />
    </Theme>,
    initialPath,
  )
}

function navItems() {
  return [...document.querySelectorAll('.astryx-side-nav-item')]
}

describe('AppSideNav', () => {
  it('renders one navigation item per route, labelled for screen readers', async () => {
    renderSideNav('/')

    await waitFor(() => {
      expect(navItems()).toHaveLength(ROUTE_LABELS.length)
    })

    const labels = navItems().map((el) => el.getAttribute('aria-label'))
    expect(labels).toEqual(ROUTE_LABELS)
  })

  it('describes each collapsed item with a tooltip', async () => {
    renderSideNav('/')

    await waitFor(() => {
      expect(navItems()).toHaveLength(ROUTE_LABELS.length)
    })

    // The rail is collapsed, so the visible label is hidden and the item
    // points at a tooltip element instead.
    for (const item of navItems()) {
      expect(item.getAttribute('aria-describedby')).toBeTruthy()
      expect(item.textContent?.trim()).toBe('')
    }
  })

  it('marks the active route as the current page', async () => {
    renderSideNav('/apps')

    await waitFor(() => {
      expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    })
    expect(document.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Apps')
  })

  it('does not mark an unrelated route as current', async () => {
    renderSideNav('/settings')

    await waitFor(() => {
      expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    })
    expect(document.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Settings')
  })
})
