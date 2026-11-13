import { create } from 'zustand'

interface UIState {
  theme: 'dark' | 'light'
  commandPaletteOpen: boolean
  startupLoading: boolean
  setTheme: (theme: 'dark' | 'light') => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setStartupLoading: (loading: boolean) => void
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getInitialTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Render-only theme state. The persisted value lives in config.json and is
// synced in by AppShell/BottomDock once the config query resolves.
export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  commandPaletteOpen: false,
  startupLoading: true,

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setStartupLoading: (loading) => set({ startupLoading: loading }),
}))

applyTheme(getInitialTheme())
