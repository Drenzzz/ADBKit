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

  it('toggles theme', () => {
    const before = useUIStore.getState().theme
    useUIStore.getState().toggleTheme()
    const after = useUIStore.getState().theme
    expect(after).not.toBe(before)
  })

  it('sets theme explicitly', () => {
    useUIStore.getState().setTheme('light')
    expect(useUIStore.getState().theme).toBe('light')

    useUIStore.getState().setTheme('dark')
    expect(useUIStore.getState().theme).toBe('dark')
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
