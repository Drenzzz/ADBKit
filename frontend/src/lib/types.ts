export type BinaryName = 'adb' | 'fastboot' | 'scrcpy'

export type BinaryStatusValue = 'ready' | 'missing' | 'invalid_path' | 'downloading'

export type BinarySource =
  | 'config'
  | 'system-path'
  | 'app-data'
  | 'common-path'

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
  adbCandidates: BinaryInfo[]
  fastbootCandidates: BinaryInfo[]
  scrcpyCandidates: BinaryInfo[]
}

export interface SetupState {
  status: BinarySetupResult
  setupCompleted: boolean
  /** True when adb, fastboot, and scrcpy are all ready. */
  canFinish: boolean
}

export interface PlatformToolsSelection {
  directory: string
  adbPath: string
  fastbootPath: string
}

export interface ScrcpyDirectorySelection {
  directory: string
  scrcpyPath: string
}

export interface Capabilities {
  adbAvailable: boolean
  fastbootAvailable: boolean
  scrcpyAvailable: boolean
  setupCompleted: boolean
  wirelessPairingSupported: boolean
  clipboardSyncSupported: boolean
}

export type SetupWizardStep = 'welcome' | 'setup-binary' | 'finish'

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

export type DeviceNicknames = Record<string, string>

export type PackageFilter = 'user' | 'system' | 'all'

export type PackageStatusFilter = 'all' | 'enabled' | 'disabled'

export type PackageSortOrder = 'az' | 'za' | 'size-desc' | 'size-asc'

export type PackageBatchAction = 'uninstall' | 'enable' | 'disable' | 'force-stop' | 'clear-data' | 'pull-apk'

export interface PackageInfo {
  packageName: string
  isEnabled: boolean
  isSystemApp: boolean
}

export interface PackageDetails {
  packageName: string
  versionName: string
  versionCode: string
  apkSizeBytes: number
  dataSizeBytes: number
  totalSizeBytes: number
}

export interface FileEntry {
  name: string
  path: string
  type: 'directory' | 'file' | 'symlink' | 'other'
  size: number
  sizeHuman: string
  permissions: string
  modifiedAt: string
  isHidden: boolean
}

export interface StorageInfo {
  mountPoint: string
  totalBytes: number
  usedBytes: number
  freeBytes: number
  usedPct: number
}

export interface SdCard {
  id: string
  mountPoint: string
  description: string
  isExternal: boolean
}

export type UnblockType = 'public' | 'protected' | 'system'

export interface UnblockResult {
  type: UnblockType
  path: string
  reason: string
}

export type FileSortField = 'name' | 'size' | 'date'

export type FileSortDirection = 'asc' | 'desc'

export type TerminalMode = 'adb-shell' | 'adb-host' | 'fastboot-host'

export interface TerminalSession {
  id: string
  serial: string
  mode: TerminalMode
}

export interface TerminalOutputEvent {
  sessionId: string
  serial: string
  data: string
}

export interface TerminalClosedEvent {
  sessionId: string
  serial: string
}

export interface TerminalHistoryEntry {
  id: string
  command: string
  serial: string
  mode: TerminalMode
  timestamp: number
}

export interface TerminalState {
  session: TerminalSession | null
  history: TerminalHistoryEntry[]
  output: string
  mode: TerminalMode
  connecting: boolean
  connected: boolean
  error: string | null
}

export type LogcatLevel = 'V' | 'D' | 'I' | 'W' | 'E' | 'F'

export interface LogcatEntry {
  id: string
  serial: string
  date: string
  time: string
  pid: string
  tid: string
  level: LogcatLevel
  tag: string
  message: string
  raw: string
  timestamp: string
}

export interface LogcatStatusEvent {
  serial: string
  status: 'started' | 'stopped' | 'error'
}

export interface LogcatFilter {
  levels: LogcatLevel[]
  tag: string
  text: string
}

export interface LogcatState {
  logs: LogcatEntry[]
  streamingSerial: string
  isStreaming: boolean
  autoScroll: boolean
  filter: LogcatFilter
  error: string | null
  lastUpdatedAt: number | null
}

export interface FastbootDeviceInfo {
  serial: string
  state: DeviceState
  mode: DeviceMode
}

export interface FlashStep {
  partition: string
  image_file: string
}

export interface FlashPlan {
  steps: FlashStep[]
}

export type OperationStatus = 'idle' | 'pending' | 'running' | 'success' | 'error' | 'cancelled'

export interface FlashPlanStepStatus {
  partition: string
  imageFile: string
  status: OperationStatus
  detail: string | null
}

export type FlasherMode = 'fastboot' | 'fastbootd' | 'sideload'

export interface FlasherState {
  fastbootDevices: FastbootDeviceInfo[]
  activeFastbootSerial: string
  deviceMode: FlasherMode | null
  isUserspace: boolean
  selectedPartition: string
  selectedImagePath: string
  romFolderPath: string
  flashPlan: FlashPlan | null
  flashPlanSteps: FlashPlanStepStatus[]
  selectedPartitions: string[]
  currentSlot: string
  customCommand: string
  customCommandOutput: string
  sideloadFilePath: string
  loadingDevices: boolean
  refreshingDevices: boolean
  scanningPlan: boolean
  runningFlash: boolean
  runningBatchFlash: boolean
  runningWipe: boolean
  runningSideload: boolean
  runningSlotChange: boolean
  runningCommand: boolean
  error: string | null
  lastUpdatedAt: number | null
}

export interface FlasherActions {
  setFastbootDevices: (devices: FastbootDeviceInfo[]) => void
  setActiveFastbootSerial: (serial: string) => void
  setDeviceMode: (mode: FlasherMode | null) => void
  setIsUserspace: (isUserspace: boolean) => void
  setSelectedPartition: (partition: string) => void
  setSelectedImagePath: (path: string) => void
  setRomFolderPath: (path: string) => void
  setFlashPlan: (plan: FlashPlan | null) => void
  setFlashPlanStepStatus: (partition: string, status: OperationStatus, detail?: string | null) => void
  togglePartitionSelection: (partition: string) => void
  selectAllPartitions: () => void
  deselectAllPartitions: () => void
  setCurrentSlot: (slot: string) => void
  setCustomCommand: (command: string) => void
  setCustomCommandOutput: (output: string) => void
  setSideloadFilePath: (path: string) => void
  setLoadingDevices: (loading: boolean) => void
  setRefreshingDevices: (refreshing: boolean) => void
  setScanningPlan: (scanning: boolean) => void
  setRunningFlash: (running: boolean) => void
  setRunningBatchFlash: (running: boolean) => void
  setRunningWipe: (running: boolean) => void
  setRunningSideload: (running: boolean) => void
  setRunningSlotChange: (running: boolean) => void
  setRunningCommand: (running: boolean) => void
  setError: (error: string | null) => void
  setLastUpdatedAt: (time: number | null) => void
  reset: () => void
}

export type ScrcpySessionStatus =
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error'

export interface ScrcpyOptions {
  max_size: number
  bit_rate: number
  max_fps: number
  audio_bit_rate: number
  audio_codec: string
  video_codec: string
  show_touches: boolean
  no_audio: boolean
  no_control: boolean
  stay_awake: boolean
  turn_screen_off: boolean
  power_off_on_close: boolean
  fullscreen: boolean
  always_on_top: boolean
  disable_screensaver: boolean
  rotation: number
  display_id: number
  time_limit: number
}

export interface ScrcpySession {
  id: string
  serial: string
  status: ScrcpySessionStatus
  pid: number
  startedAt: number
}

export interface ScrcpySessionEvent {
  sessionId: string
  serial: string
  status: ScrcpySessionStatus
  pid?: number
  message?: string
}

export interface ScrcpyCodecSupport {
  codec: string
  encoderName: string
  hardware: boolean
  vendor: boolean
  softwareOnly: boolean
  recommended: boolean
  aliasOf: string
}

export interface ScrcpyEncoderSupport {
  serial: string
  videoCodecs: ScrcpyCodecSupport[]
  audioCodecs: ScrcpyCodecSupport[]
}

export interface ScrcpyPreset {
  id: string
  name: string
  options: ScrcpyOptions
  createdAt: number
}

export interface ScrcpyState {
  session: ScrcpySession | null
  options: ScrcpyOptions
  encoderSupport: ScrcpyEncoderSupport | null
  presets: ScrcpyPreset[]
  isStarting: boolean
  isStopping: boolean
  isRecording: boolean
  recordingStartedAt: number | null
  isFetchingEncoder: boolean
  error: string | null
  lastEventAt: number | null
}

export type AuditLogLevel = 'info' | 'warning' | 'error' | 'debug' | 'success'

export type AuditLogOutcome = 'all' | 'succeeded' | 'failed'

export type AuditLogSort = 'newest' | 'oldest'

export interface AuditLogEntry {
  id: number
  timestamp: string
  level: AuditLogLevel
  operation: string
  message: string
  details?: string
  duration?: string
  success: boolean
}

export interface AuditLogFilters {
  levels: AuditLogLevel[]
  operation: string
  text: string
  outcome: AuditLogOutcome
  sort: AuditLogSort
}

export interface ScrcpyPresetSnapshot {
  name: string
  options: ScrcpyOptions
}

export interface PreferencesPayload {
  theme: 'dark' | 'light'
  device_nicknames?: Record<string, string>
  logcat_buffer_limit?: number
  scrcpy_presets?: ScrcpyPresetSnapshot[]
  default_terminal_mode?: string
  auto_refresh_devices?: boolean
  device_refresh_seconds?: number
  audit_enabled?: boolean
}

export interface AppConfigSnapshot {
  adb_path: string
  fastboot_path: string
  scrcpy_path: string
  setup_completed: boolean
  theme: string
  binary_versions: Record<string, string>
  device_nicknames: Record<string, string>
  logcat_buffer_limit: number
  scrcpy_options: ScrcpyOptions
  scrcpy_presets: ScrcpyPresetSnapshot[]
  default_terminal_mode: string
  auto_refresh_devices: boolean
  device_refresh_seconds: number
  audit_enabled: boolean
}

export interface RuntimeDiagnostics {
  os: string
  arch: string
  data_dir: string
  config_path: string
  managed_binary_dir: string
  setup_completed: boolean
  theme: string
  binary_versions: Record<string, string>
  capabilities: Record<string, boolean>
}

export interface SettingsState {
  appConfig: AppConfigSnapshot | null
  preferencesDraft: PreferencesPayload
  auditLogs: AuditLogEntry[]
  auditLogLimit: number
  auditLogFilters: AuditLogFilters
  selectedAuditLogId: number | null
  loadingConfig: boolean
  savingPreferences: boolean
  loadingAuditLogs: boolean
  clearingAuditLogs: boolean
  preferencesError: string | null
  auditLogsError: string | null
  auditLogsLoadedAt: number | null
}
