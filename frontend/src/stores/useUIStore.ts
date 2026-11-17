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

function getInitialTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Render-only theme state. The persisted value lives in config.json and is
// synced in by AppShell/BottomDock once the config query resolves. The value
// feeds <Theme mode=...> at the app root; Astryx syncs data-theme on <html>.
export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  commandPaletteOpen: false,
  startupLoading: true,

  setTheme: (theme) => set({ theme }),

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setStartupLoading: (loading) => set({ startupLoading: loading }),
}))
