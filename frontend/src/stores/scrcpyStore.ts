import { create } from 'zustand'
import type {
  ScrcpyEncoderSupport,
  ScrcpyOptions,
  ScrcpyPreset,
  ScrcpySession,
  ScrcpySessionEvent,
  ScrcpyState,
} from '@/lib/types'

const DEFAULT_OPTIONS: ScrcpyOptions = {
  max_size: 0,
  bit_rate: 8000000,
  max_fps: 0,
  audio_bit_rate: 128000,
  audio_codec: 'opus',
  video_codec: 'h264',
  show_touches: false,
  no_audio: false,
  no_control: false,
  stay_awake: true,
  turn_screen_off: false,
  power_off_on_close: false,
  fullscreen: false,
  always_on_top: false,
  disable_screensaver: false,
  rotation: 0,
  display_id: 0,
  time_limit: 0,
}

interface ScrcpyActions {
  setSession: (session: ScrcpySession | null) => void
  setOptions: (options: ScrcpyOptions) => void
  setEncoderSupport: (support: ScrcpyEncoderSupport | null) => void
  setIsStarting: (isStarting: boolean) => void
  setIsStopping: (isStopping: boolean) => void
  setIsRecording: (isRecording: boolean) => void
  setRecordingStartedAt: (timestamp: number | null) => void
  setIsFetchingEncoder: (isFetching: boolean) => void
  setError: (error: string | null) => void
  applyStartedEvent: (event: ScrcpySessionEvent) => void
  applyStoppedEvent: (event: ScrcpySessionEvent) => void
  applyErrorEvent: (event: ScrcpySessionEvent) => void
  addPreset: (preset: ScrcpyPreset) => void
  removePreset: (id: string) => void
  reset: () => void
}

type ScrcpyStore = ScrcpyState & ScrcpyActions

const INITIAL_STATE: ScrcpyState = {
  session: null,
  options: DEFAULT_OPTIONS,
  encoderSupport: null,
  presets: [],
  isStarting: false,
  isStopping: false,
  isRecording: false,
  recordingStartedAt: null,
  isFetchingEncoder: false,
  error: null,
  lastEventAt: null,
}

function mergeSessionFromEvent(
  current: ScrcpySession | null,
  event: ScrcpySessionEvent,
): ScrcpySession {
  return {
    id: event.sessionId,
    serial: event.serial,
    status: event.status,
    pid: event.pid ?? current?.pid ?? 0,
    startedAt: current?.startedAt ?? Date.now(),
  }
}

export const useScrcpyStore = create<ScrcpyStore>()((set) => ({
  ...INITIAL_STATE,
  options: { ...DEFAULT_OPTIONS },
  setSession: (session) => set({ session }),
  setOptions: (options) => set({ options }),
  setEncoderSupport: (encoderSupport) => set({ encoderSupport }),
  setIsStarting: (isStarting) => set({ isStarting }),
  setIsStopping: (isStopping) => set({ isStopping }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setRecordingStartedAt: (recordingStartedAt) => set({ recordingStartedAt }),
  setIsFetchingEncoder: (isFetchingEncoder) => set({ isFetchingEncoder }),
  setError: (error) => set({ error }),
  applyStartedEvent: (event) =>
    set((state) => ({
      session: mergeSessionFromEvent(state.session, event),
      isStarting: false,
      isStopping: false,
      error: null,
      lastEventAt: Date.now(),
    })),
  applyStoppedEvent: (event) =>
    set((state) => {
      if (state.session?.id !== event.sessionId) {
        return state
      }
      return {
        session: null,
        isStarting: false,
        isStopping: false,
        error: null,
        lastEventAt: Date.now(),
      }
    }),
  applyErrorEvent: (event) =>
    set((state) => ({
      session:
        state.session?.id === event.sessionId
          ? { ...state.session, status: 'error' }
          : state.session,
      isStarting: false,
      isStopping: false,
      error: event.message ?? 'Scrcpy session failed unexpectedly',
      lastEventAt: Date.now(),
    })),
  addPreset: (preset) =>
    set((state) => ({ presets: [preset, ...state.presets] })),
  removePreset: (id) =>
    set((state) => ({ presets: state.presets.filter((p) => p.id !== id) })),
  reset: () => set({ ...INITIAL_STATE, options: { ...DEFAULT_OPTIONS } }),
}))
