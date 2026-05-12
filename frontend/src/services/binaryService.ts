import {
  GetBinaryStatus,
  GetSetupState,
  RetryBinaryDetection,
  SetCustomBinary,
  ClearCustomBinary,
  CompleteSetup,
  GetManagedBinaryDir,
  ListManagedBinaries,
  GetCapabilities,
  SelectBinaryFile,
  SelectPlatformToolsDirectory,
} from '../../wailsjs/go/main/App'
import type {
  BinaryName,
  BinarySetupResult,
  SetupState,
  PlatformToolsSelection,
  Capabilities,
} from '@/lib/types'

export async function getBinaryStatus(): Promise<BinarySetupResult> {
  const raw = await GetBinaryStatus()
  return raw as unknown as BinarySetupResult
}

export async function getSetupState(): Promise<SetupState> {
  const raw = await GetSetupState()
  return raw as unknown as SetupState
}

export async function retryBinaryDetection(): Promise<BinarySetupResult> {
  const raw = await RetryBinaryDetection()
  return raw as unknown as BinarySetupResult
}

export async function setCustomBinary(
  name: BinaryName,
  path: string,
): Promise<void> {
  await SetCustomBinary(name, path)
}

export async function clearCustomBinary(name: BinaryName): Promise<void> {
  await ClearCustomBinary(name)
}

export async function completeSetup(): Promise<SetupState> {
  const raw = await CompleteSetup()
  return raw as unknown as SetupState
}

export async function getManagedBinaryDir(): Promise<string> {
  return GetManagedBinaryDir()
}

export async function listManagedBinaries(): Promise<string[]> {
  return ListManagedBinaries()
}

export async function getCapabilities(): Promise<Capabilities> {
  const raw = await GetCapabilities()
  return raw as unknown as Capabilities
}

export async function selectBinaryFile(
  name: BinaryName,
): Promise<string> {
  return SelectBinaryFile(name)
}

export async function selectPlatformToolsDirectory(): Promise<PlatformToolsSelection> {
  const raw = await SelectPlatformToolsDirectory()
  return raw as unknown as PlatformToolsSelection
}
