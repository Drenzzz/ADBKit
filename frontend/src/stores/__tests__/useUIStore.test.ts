import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../useUIStore'

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.getState().setTheme('dark')
    useUIStore.getState().setCommandPaletteOpen(false)
    useUIStore.getState().setStartupLoading(true)
  })

  it('has initial theme', () => {
    const theme = useUIStore.getState().theme
    expect(['dark', 'light']).toContain(theme)
  })

  it('sets theme explicitly', () => {
    useUIStore.getState().setTheme('light')
    expect(useUIStore.getState().theme).toBe('light')

    useUIStore.getState().setTheme('dark')
    expect(useUIStore.getState().theme).toBe('dark')
  })

  it('applies the theme class to the document root', () => {
    useUIStore.getState().setTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    useUIStore.getState().setTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('does not persist theme to localStorage', () => {
    useUIStore.getState().setTheme('light')
    expect(localStorage.getItem('adbkit-theme')).toBeNull()
  })

  it('toggles command palette', () => {
    expect(useUIStore.getState().commandPaletteOpen).toBe(false)
    useUIStore.getState().toggleCommandPalette()
    expect(useUIStore.getState().commandPaletteOpen).toBe(true)
    useUIStore.getState().toggleCommandPalette()
    expect(useUIStore.getState().commandPaletteOpen).toBe(false)
  })

  it('sets command palette open', () => {
    useUIStore.getState().setCommandPaletteOpen(true)
    expect(useUIStore.getState().commandPaletteOpen).toBe(true)
  })

  it('sets startup loading', () => {
    useUIStore.getState().setStartupLoading(false)
    expect(useUIStore.getState().startupLoading).toBe(false)
  })
})
