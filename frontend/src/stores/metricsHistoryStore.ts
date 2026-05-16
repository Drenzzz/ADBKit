import { create } from 'zustand'

const MAX_HISTORY = 30

interface MetricsHistoryState {
  cpuHistory: number[]
  ramHistory: number[]
  rxHistory: number[]
  pushCPU: (value: number) => void
  pushRAM: (value: number) => void
  pushRX: (value: number) => void
  reset: () => void
}

export const useMetricsHistoryStore = create<MetricsHistoryState>()((set) => ({
  cpuHistory: [],
  ramHistory: [],
  rxHistory: [],

  pushCPU: (value) =>
    set((state) => ({
      cpuHistory: [...state.cpuHistory.slice(-(MAX_HISTORY - 1)), value],
    })),

  pushRAM: (value) =>
    set((state) => ({
      ramHistory: [...state.ramHistory.slice(-(MAX_HISTORY - 1)), value],
    })),

  pushRX: (value) =>
    set((state) => ({
      rxHistory: [...state.rxHistory.slice(-(MAX_HISTORY - 1)), value],
    })),

  reset: () => set({ cpuHistory: [], ramHistory: [], rxHistory: [] }),
}))
