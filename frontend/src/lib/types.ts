export type BinaryName = 'adb' | 'fastboot' | 'scrcpy'

export type BinaryStatusValue = 'ready' | 'missing' | 'invalid_path' | 'downloading'

export type BinarySource =
  | 'config'
  | 'system-path'
  | 'app-data'
  | 'common-path'
  | 'skipped'

export interface BinaryInfo {
  name: string
  path: string
  source: string
  status: BinaryStatusValue
  version?: string
  reason?: string
}

export interface BinarySetupResult {
  adb: BinaryInfo
  fastboot: BinaryInfo
  scrcpy: BinaryInfo
  ready: boolean
}

export interface SetupState {
  status: BinarySetupResult
  setupCompleted: boolean
  canFinish: boolean
}

export interface PlatformToolsSelection {
  directory: string
  adbPath: string
  fastbootPath: string
}

export interface Capabilities {
  adbAvailable: boolean
  fastbootAvailable: boolean
  scrcpyAvailable: boolean
  setupCompleted: boolean
  wirelessPairingSupported: boolean
  audioCaptureSupported: boolean
  clipboardSyncSupported: boolean
}

export type SetupWizardStep = 'welcome' | 'platform-tools' | 'scrcpy' | 'summary'

export interface SetupWizardState {
  currentStep: SetupWizardStep
  setupState: SetupState | null
  loading: boolean
  submitting: boolean
  error: string | null
  selectedPaths: Partial<Record<BinaryName, string>>
}

export type DeviceMode = 'adb' | 'fastboot' | 'unknown'

export type DeviceState =
  | 'device'
  | 'offline'
  | 'unauthorized'
  | 'recovery'
  | 'sideload'
  | 'fastboot'
  | 'unknown'

export interface DeviceSummary {
  serial: string
  state: DeviceState
  mode: DeviceMode
  product?: string
  model?: string
  device?: string
  transportId?: string
}

export interface DeviceInfo {
  serial: string
  state: DeviceState
  mode: DeviceMode
  product?: string
  model?: string
  device?: string
  brand?: string
  codename?: string
  manufacturer?: string
  androidVersion?: string
  sdkVersion?: string
  buildId?: string
  securityPatch?: string
  abis?: string
  transportId?: string
  connectionLabel?: string
  ipAddress?: string
  rootStatus?: string
  batteryLevel?: string
  storageInfo?: string
  ramTotal?: string
}

export interface PerformanceSnapshot {
  serial: string
  cpuUsage: number
  ramUsage: number
  ramUsedBytes?: number
  ramTotalBytes?: number
  networkRxBytes?: number
  networkTxBytes?: number
  networkRxSec: number
  networkTxSec: number
  batteryLevel?: number
  batteryTemperatureC?: number
  storageUsedBytes?: number
  storageTotalBytes?: number
  uptimeSeconds?: number
}
