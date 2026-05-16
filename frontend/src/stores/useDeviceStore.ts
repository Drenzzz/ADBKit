import { create } from 'zustand'
import type {
  DeviceSummary,
  DeviceInfo,
  DeviceMode,
  PerformanceSnapshot,
  DeviceNicknames,
} from '@/lib/types'

interface DeviceState {
  devices: DeviceSummary[]
  activeSerial: string
  deviceInfo: DeviceInfo | null
  deviceMode: DeviceMode | null
  performance: PerformanceSnapshot | null
  nicknames: DeviceNicknames
  loading: boolean
  refreshing: boolean
  infoLoading: boolean
  perfLoading: boolean
  error: string | null
  lastUpdatedAt: number | null
}

interface DeviceActions {
  setDevices: (devices: DeviceSummary[]) => void
  setActiveSerial: (serial: string) => void
  setDeviceInfo: (info: DeviceInfo | null) => void
  setDeviceMode: (mode: DeviceMode | null) => void
  setPerformance: (perf: PerformanceSnapshot | null) => void
  setNicknames: (nicknames: DeviceNicknames) => void
  setNickname: (serial: string, nickname: string) => void
  getNickname: (serial: string) => string
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setInfoLoading: (infoLoading: boolean) => void
  setPerfLoading: (perfLoading: boolean) => void
  setError: (error: string | null) => void
  setLastUpdatedAt: (timestamp: number | null) => void
  reset: () => void
}

type DeviceStore = DeviceState & DeviceActions

const initialState: DeviceState = {
  devices: [],
  activeSerial: '',
  deviceInfo: null,
  deviceMode: null,
  performance: null,
  nicknames: {},
  loading: false,
  refreshing: false,
  infoLoading: false,
  perfLoading: false,
  error: null,
  lastUpdatedAt: null,
}

export const useDeviceStore = create<DeviceStore>()((set, get) => ({
  ...initialState,

  setDevices: (devices) => set({ devices }),
  setActiveSerial: (activeSerial) => set({ activeSerial }),
  setDeviceInfo: (deviceInfo) => set({ deviceInfo }),
  setDeviceMode: (deviceMode) => set({ deviceMode }),
  setPerformance: (performance) => set({ performance }),
  setNicknames: (nicknames) => set({ nicknames }),
  setNickname: (serial, nickname) =>
    set((state) => {
      const trimmed = serial.trim()
      if (!trimmed) return state
      const next = { ...state.nicknames }
      const trimmedNick = nickname.trim()
      if (trimmedNick) {
        next[trimmed] = trimmedNick
      } else {
        delete next[trimmed]
      }
      return { nicknames: next }
    }),
  getNickname: (serial) => get().nicknames[serial] ?? '',
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setInfoLoading: (infoLoading) => set({ infoLoading }),
  setPerfLoading: (perfLoading) => set({ perfLoading }),
  setError: (error) => set({ error }),
  setLastUpdatedAt: (lastUpdatedAt) => set({ lastUpdatedAt }),
  reset: () => set(initialState),
}))
