import { create } from 'zustand'

interface UIState {
  theme: 'dark' | 'light'
  commandPaletteOpen: boolean
  startupLoading: boolean
  toggleTheme: () => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setStartupLoading: (loading: boolean) => void
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getInitialTheme(): 'dark' | 'light' {
  const saved = localStorage.getItem('adbkit-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  commandPaletteOpen: false,
  startupLoading: true,

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('adbkit-theme', next)
      applyTheme(next)
      return { theme: next }
    }),

  setTheme: (theme) => {
    localStorage.setItem('adbkit-theme', theme)
    applyTheme(theme)
    set({ theme })
  },

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setStartupLoading: (loading) => set({ startupLoading: loading }),
}))

applyTheme(getInitialTheme())
