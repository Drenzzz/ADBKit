import { create } from 'zustand'
import type {
  DeviceSummary,
  DeviceInfo,
  DeviceMode,
  PerformanceSnapshot,
} from '@/lib/types'

interface DeviceState {
  devices: DeviceSummary[]
  activeSerial: string
  deviceInfo: DeviceInfo | null
  deviceMode: DeviceMode | null
  performance: PerformanceSnapshot | null
  devicesLoading: boolean
  infoLoading: boolean
  perfLoading: boolean
  error: string | null
}

interface DeviceActions {
  setDevices: (devices: DeviceSummary[]) => void
  setActiveSerial: (serial: string) => void
  setDeviceInfo: (info: DeviceInfo | null) => void
  setDeviceMode: (mode: DeviceMode | null) => void
  setPerformance: (perf: PerformanceSnapshot | null) => void
  setDevicesLoading: (loading: boolean) => void
  setInfoLoading: (loading: boolean) => void
  setPerfLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

type DeviceStore = DeviceState & DeviceActions

const initialState: DeviceState = {
  devices: [],
  activeSerial: '',
  deviceInfo: null,
  deviceMode: null,
  performance: null,
  devicesLoading: false,
  infoLoading: false,
  perfLoading: false,
  error: null,
}

export const useDeviceStore = create<DeviceStore>()((set) => ({
  ...initialState,

  setDevices: (devices) => set({ devices }),
  setActiveSerial: (activeSerial) => set({ activeSerial }),
  setDeviceInfo: (deviceInfo) => set({ deviceInfo }),
  setDeviceMode: (deviceMode) => set({ deviceMode }),
  setPerformance: (performance) => set({ performance }),
  setDevicesLoading: (devicesLoading) => set({ devicesLoading }),
  setInfoLoading: (infoLoading) => set({ infoLoading }),
  setPerfLoading: (perfLoading) => set({ perfLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
