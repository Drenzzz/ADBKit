import { vi } from 'vitest'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Stub service adapters used across routes so component-level renders
// don't have to mock every Wails binding call individually.
vi.mock('@/services/deviceService', () => ({
  getDevices: vi.fn().mockResolvedValue([]),
  getActiveSerial: vi.fn().mockResolvedValue(''),
  setActiveSerial: vi.fn().mockResolvedValue(undefined),
  getDeviceInfo: vi.fn().mockResolvedValue({}),
  getDeviceMode: vi.fn().mockResolvedValue('unknown'),
  rebootDevice: vi.fn().mockResolvedValue('OK'),
  connectWireless: vi.fn().mockResolvedValue('connected'),
  enableWirelessTCPIP: vi.fn().mockResolvedValue('tcpip'),
  disconnectWireless: vi.fn().mockResolvedValue('disconnected'),
  getPerformanceSnapshot: vi.fn().mockResolvedValue({}),
  getDeviceNicknames: vi.fn().mockResolvedValue({}),
  setDeviceNickname: vi.fn().mockResolvedValue(undefined),
  clearDeviceNickname: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/binaryService', () => ({
  getSetupState: vi.fn().mockResolvedValue({
    status: { ready: true, adb: {}, fastboot: {}, scrcpy: {} },
    setupCompleted: true,
    canFinish: true,
  }),
  getBinaryStatus: vi.fn().mockResolvedValue({}),
  retryBinaryDetection: vi.fn().mockResolvedValue({}),
  setCustomBinary: vi.fn().mockResolvedValue(undefined),
  clearCustomBinary: vi.fn().mockResolvedValue(undefined),
  completeSetup: vi.fn().mockResolvedValue({}),
  getManagedBinaryDir: vi.fn().mockReturnValue(''),
  listManagedBinaries: vi.fn().mockResolvedValue([]),
  selectBinaryFile: vi.fn().mockResolvedValue(''),
  selectPlatformToolsDirectory: vi.fn().mockResolvedValue({}),
  selectScrcpyDirectory: vi.fn().mockResolvedValue({}),
  downloadPlatformTools: vi.fn().mockResolvedValue(undefined),
  downloadScrcpy: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/settingsService', () => ({
  getAppConfig: vi.fn().mockResolvedValue({
    adb_path: '',
    fastboot_path: '',
    scrcpy_path: '',
    setup_completed: true,
    theme: 'dark',
    binary_versions: {},
    device_nicknames: {},
    logcat_buffer_limit: 5000,
    scrcpy_options: {},
    scrcpy_presets: [],
    default_terminal_mode: 'adb-shell',
    auto_refresh_devices: true,
    device_refresh_seconds: 8,
    audit_enabled: true,
  }),
  savePreferences: vi.fn().mockResolvedValue(undefined),
  getAuditLogs: vi.fn().mockResolvedValue([]),
  clearAuditLogs: vi.fn().mockResolvedValue(undefined),
  exportAuditLogs: vi.fn().mockResolvedValue(undefined),
  importAuditLogs: vi.fn().mockResolvedValue(0),
  getRuntimeDiagnostics: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/services/fileService', () => ({
  listFiles: vi.fn().mockResolvedValue([]),
  pushFile: vi.fn().mockResolvedValue('OK'),
  pullFile: vi.fn().mockResolvedValue('OK'),
  deleteFile: vi.fn().mockResolvedValue('OK'),
  createDirectory: vi.fn().mockResolvedValue('OK'),
  renameFile: vi.fn().mockResolvedValue('OK'),
  getStorageInfo: vi.fn().mockResolvedValue({}),
  cancelTransfer: vi.fn(),
}))

vi.mock('@/services/fileDropService', () => ({
  onFileDrop: vi.fn().mockReturnValue(() => {}),
}))

vi.mock('@/services/packageService', () => ({
  listPackages: vi.fn().mockResolvedValue([]),
  installPackage: vi.fn().mockResolvedValue('OK'),
  uninstallPackage: vi.fn().mockResolvedValue('OK'),
  uninstallMultiplePackages: vi.fn().mockResolvedValue('OK'),
  enablePackage: vi.fn().mockResolvedValue('OK'),
  disablePackage: vi.fn().mockResolvedValue('OK'),
  enableMultiplePackages: vi.fn().mockResolvedValue('OK'),
  disableMultiplePackages: vi.fn().mockResolvedValue('OK'),
  forceStopPackage: vi.fn().mockResolvedValue('OK'),
  clearPackageData: vi.fn().mockResolvedValue('OK'),
  pullPackage: vi.fn().mockResolvedValue('OK'),
  getPackageDetails: vi.fn().mockResolvedValue({}),
  launchPackage: vi.fn().mockResolvedValue('OK'),
}))

vi.mock('@/services/fastbootService', () => ({
  listFastbootDevices: vi.fn().mockResolvedValue([]),
  flashPartition: vi.fn().mockResolvedValue('OK'),
  wipeData: vi.fn().mockResolvedValue('OK'),
  getActiveSlot: vi.fn().mockResolvedValue('a'),
  setActiveSlot: vi.fn().mockResolvedValue('OK'),
  runFastbootCommand: vi.fn().mockResolvedValue('OK'),
  sideloadPackage: vi.fn().mockResolvedValue('OK'),
  fastbootContinue: vi.fn().mockResolvedValue('OK'),
  fastbootReboot: vi.fn().mockResolvedValue('OK'),
  fastbootRebootBootloader: vi.fn().mockResolvedValue('OK'),
  scanRomFolder: vi.fn().mockResolvedValue({ steps: [] }),
  flashRomFolder: vi.fn().mockResolvedValue('OK'),
  isUserspaceFastboot: vi.fn().mockResolvedValue(false),
  wakeDevice: vi.fn().mockResolvedValue('OK'),
  unlockDevice: vi.fn().mockResolvedValue('OK'),
  stayAwakeDevice: vi.fn().mockResolvedValue('OK'),
}))

vi.mock('@/services/scrcpyService', () => ({
  startScrcpySession: vi.fn().mockResolvedValue({ id: 'test', serial: 'ABC123' }),
  stopScrcpySession: vi.fn().mockResolvedValue('OK'),
  getActiveScrcpySession: vi.fn().mockResolvedValue(null),
  startScrcpyRecording: vi.fn().mockResolvedValue(undefined),
  stopScrcpyRecording: vi.fn().mockResolvedValue(''),
  takeScrcpyScreenshot: vi.fn().mockResolvedValue('/tmp/ss.png'),
  pushScrcpyClipboard: vi.fn().mockResolvedValue(undefined),
  getScrcpyClipboard: vi.fn().mockResolvedValue(''),
  listScrcpyEncoders: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/services/terminalService', () => ({
  startTerminalSession: vi.fn().mockResolvedValue({ id: 'test' }),
  closeTerminal: vi.fn().mockResolvedValue(undefined),
  sendTerminalCommand: vi.fn().mockResolvedValue(undefined),
  getActiveTerminalSession: vi.fn().mockResolvedValue(null),
  startLogcatStream: vi.fn().mockResolvedValue(undefined),
  stopLogcatStream: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/downloadService', () => ({}))

export function renderRoute(node: ReactElement, initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>{node}</MemoryRouter>
    </QueryClientProvider>,
  )
}
