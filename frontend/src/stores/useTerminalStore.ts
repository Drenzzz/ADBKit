import { create } from 'zustand'
import type {
  TerminalClosedEvent,
  TerminalHistoryEntry,
  TerminalMode,
  TerminalOutputEvent,
  TerminalSession,
  TerminalState,
} from '@/lib/types'

const TERMINAL_HISTORY_LIMIT = 200

interface TerminalActions {
  setSession: (session: TerminalSession | null) => void
  setMode: (mode: TerminalMode) => void
  setConnecting: (connecting: boolean) => void
  setConnected: (connected: boolean) => void
  setError: (error: string | null) => void
  appendOutput: (output: string) => void
  clearOutput: () => void
  pushHistory: (
    command: string,
    serial: string,
    mode: TerminalMode,
  ) => void
  removeHistoryEntry: (entryId: string) => void
  clearHistory: () => void
  applyOutputEvent: (event: TerminalOutputEvent) => void
  applyClosedEvent: (event: TerminalClosedEvent) => void
  reset: () => void
}

type TerminalStore = TerminalState & TerminalActions

function createHistoryEntry(
  command: string,
  serial: string,
  mode: TerminalMode,
): TerminalHistoryEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    command,
    serial,
    mode,
    timestamp: Date.now(),
  }
}

const initialState: TerminalState = {
  session: null,
  history: [],
  output: '',
  mode: 'adb-shell',
  connecting: false,
  connected: false,
  error: null,
}

export const useTerminalStore = create<TerminalStore>()((set) => ({
  ...initialState,
  setSession: (session) => set({ session }),
  setMode: (mode) => set({ mode }),
  setConnecting: (connecting) => set({ connecting }),
  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ error }),
  appendOutput: (output) =>
    set((state) => ({
      output: `${state.output}${output}`,
    })),
  clearOutput: () => set({ output: '' }),
  pushHistory: (command, serial, mode) =>
    set((state) => {
      const trimmedCommand = command.trim()
      if (trimmedCommand === '') {
        return state
      }

      const nextHistory = [
        createHistoryEntry(trimmedCommand, serial, mode),
        ...state.history,
      ].slice(0, TERMINAL_HISTORY_LIMIT)

      return { history: nextHistory }
    }),
  removeHistoryEntry: (entryId) =>
    set((state) => ({
      history: state.history.filter((entry) => entry.id !== entryId),
    })),
  clearHistory: () => set({ history: [] }),
  applyOutputEvent: (event) =>
    set((state) => {
      if (state.session?.id !== event.sessionId) {
        return state
      }

      return {
        output: `${state.output}${event.data}`,
      }
    }),
  applyClosedEvent: (event) =>
    set((state) => {
      if (state.session?.id !== event.sessionId) {
        return state
      }

      return {
        session: null,
        connected: false,
        connecting: false,
      }
    }),
  reset: () =>
    set((state) => ({
      ...initialState,
      history: state.history,
    })),
}))
