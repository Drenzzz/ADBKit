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

function railButtons() {
  return [...document.querySelectorAll('aside button')]
}

describe('AppSideNav', () => {
  it('renders one rail button per route plus device status and theme switcher', async () => {
    renderSideNav('/')

    await waitFor(() => {
      expect(railButtons().length).toBeGreaterThanOrEqual(ROUTE_LABELS.length)
    })

    const labels = railButtons().map((el) => el.getAttribute('aria-label'))
    expect(labels.slice(0, ROUTE_LABELS.length)).toEqual(ROUTE_LABELS)
  })

  it('pairs every rail button with a CSS tooltip label', async () => {
    renderSideNav('/')

    await waitFor(() => {
      expect(railButtons().length).toBeGreaterThanOrEqual(ROUTE_LABELS.length)
    })

    // Each RailButton wraps its trigger and tooltip in a group; the tooltip
    // is a sibling span, not an Astryx popover (WebKitGTK clips those).
    const tooltips = document.querySelectorAll('[role="tooltip"]')
    expect(tooltips.length).toBe(railButtons().length)
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
