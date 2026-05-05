import { create } from 'zustand'

interface UIState {
  theme: 'dark' | 'light'
  dockVisible: boolean
  toggleTheme: () => void
  setDockVisible: (visible: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  dockVisible: false,
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
  setDockVisible: (visible) => set({ dockVisible: visible }),
}))
