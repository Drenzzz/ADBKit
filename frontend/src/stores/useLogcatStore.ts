import { create } from 'zustand'
import type {
  LogcatEntry,
  LogcatFilter,
  LogcatLevel,
  LogcatState,
  LogcatStatusEvent,
} from '@/lib/types'

const DEFAULT_LOGCAT_BUFFER_LIMIT = 30000
const LOGCAT_FLUSH_INTERVAL = 100

let currentBufferLimit = DEFAULT_LOGCAT_BUFFER_LIMIT
let queuedEntries: LogcatEntry[] = []
let flushTimer: number | null = null

interface LogcatActions {
  setStreamingSerial: (serial: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setAutoScroll: (autoScroll: boolean) => void
  setFilter: (filter: Partial<LogcatFilter>) => void
  setError: (error: string | null) => void
  setLastUpdatedAt: (timestamp: number | null) => void
  setBufferLimit: (limit: number) => void
  clearLogs: () => void
  appendLogs: (entries: LogcatEntry[]) => void
  applyLineEvent: (entry: LogcatEntry) => void
  applyStatusEvent: (event: LogcatStatusEvent) => void
  reset: () => void
}

interface LogcatExtraState {
  bufferLimit: number
  bufferFull: boolean
}

type LogcatStore = LogcatState & LogcatExtraState & LogcatActions

function normalizeLogLevel(level: string): LogcatLevel {
  if (level === 'D' || level === 'I' || level === 'W' || level === 'E' || level === 'F') {
    return level
  }

  return 'V'
}

function flushQueuedEntries() {
  if (queuedEntries.length === 0) {
    flushTimer = null
    return
  }

  const entries = queuedEntries
  queuedEntries = []
  flushTimer = null

  useLogcatStore.getState().appendLogs(entries)
}

function queueLogEntry(entry: LogcatEntry) {
  queuedEntries.push(entry)

  if (queuedEntries.length > currentBufferLimit) {
    queuedEntries = queuedEntries.slice(-currentBufferLimit)
  }

  if (flushTimer === null && typeof window !== 'undefined') {
    flushTimer = window.setTimeout(flushQueuedEntries, LOGCAT_FLUSH_INTERVAL)
  }
}

const initialState: LogcatState & LogcatExtraState = {
  logs: [],
  streamingSerial: '',
  isStreaming: false,
  autoScroll: true,
  filter: {
    levels: ['V', 'D', 'I', 'W', 'E', 'F'],
    tag: '',
    text: '',
  },
  error: null,
  lastUpdatedAt: null,
  bufferLimit: currentBufferLimit,
  bufferFull: false,
}

export const useLogcatStore = create<LogcatStore>()((set) => ({
  ...initialState,
  setStreamingSerial: (streamingSerial) => set({ streamingSerial }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  setFilter: (filter) =>
    set((state) => ({
      filter: {
        ...state.filter,
        ...filter,
      },
    })),
  setError: (error) => set({ error }),
  setLastUpdatedAt: (lastUpdatedAt) => set({ lastUpdatedAt }),
  setBufferLimit: (limit) => {
    currentBufferLimit = limit
    set((state) => ({
      bufferLimit: limit,
      logs: state.logs.length > limit ? state.logs.slice(-limit) : state.logs,
      bufferFull: state.logs.length >= limit,
    }))
  },
  clearLogs: () => {
    queuedEntries = []
    if (flushTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(flushTimer)
      flushTimer = null
    }
    set({ logs: [], lastUpdatedAt: Date.now(), bufferFull: false })
  },
  appendLogs: (entries) =>
    set((state) => {
      const combined = [...state.logs, ...entries]
      const trimmed = combined.length > currentBufferLimit
        ? combined.slice(-currentBufferLimit)
        : combined
      return {
        logs: trimmed,
        lastUpdatedAt: entries.length > 0 ? Date.now() : state.lastUpdatedAt,
        bufferFull: trimmed.length >= currentBufferLimit,
      }
    }),
  applyLineEvent: (entry) => {
    queueLogEntry({
      ...entry,
      level: normalizeLogLevel(entry.level),
    })
  },
  applyStatusEvent: (event) =>
    set((state) => {
      if (state.streamingSerial !== '' && state.streamingSerial !== event.serial) {
        return state
      }

      return {
        streamingSerial: event.status === 'started' ? event.serial : '',
        isStreaming: event.status === 'started',
        error:
          event.status === 'error'
            ? 'Logcat stream stopped unexpectedly'
            : event.status === 'started'
              ? null
              : state.error,
        lastUpdatedAt: Date.now(),
      }
    }),
  reset: () => {
    queuedEntries = []
    if (flushTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(flushTimer)
      flushTimer = null
    }
    set(initialState)
  },
}))
