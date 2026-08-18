declare module '../../bindings/ADBKit/internal/app/app.js' {
  export const SelectScrcpyDirectory: () => Promise<unknown>
  export const SelectPlatformToolsDirectory: () => Promise<unknown>
  export const SelectBinaryFile: (name: string) => Promise<string>
  export const SelectSavePath: (name: string) => Promise<string>
  export const SelectFile: () => Promise<string>
  export const GetBinaryStatus: () => Promise<unknown>
  export const GetSetupState: () => Promise<unknown>
  export const RetryBinaryDetection: () => Promise<unknown>
  export const SetCustomBinary: (name: string, path: string) => Promise<void>
  export const ClearCustomBinary: (name: string) => Promise<void>
  export const CompleteSetup: () => Promise<unknown>
  export const GetManagedBinaryDir: () => Promise<string>
  export const ListManagedBinaries: () => Promise<string[]>
  export const GetCapabilities: () => Promise<unknown>
}