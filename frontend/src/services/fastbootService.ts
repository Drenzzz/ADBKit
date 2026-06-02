import {
  GetFastbootDevices,
  FlashPartition,
  WipeData,
  GetActiveSlot,
  SetActiveSlot,
  RunCustomFastbootCommand,
  SideloadPackage,
  IsUserspaceFastboot,
  ScanRomFolder,
  FlashRomFolder,
  SelectFlashImageFile,
  SelectSideloadFile,
  SelectDirectory,
} from '../../wailsjs/go/main/App'
import type { FastbootDeviceInfo, FlashPlan } from '@/lib/types'

export async function getFastbootDevices(): Promise<FastbootDeviceInfo[]> {
  const raw = await GetFastbootDevices()
  return raw as unknown as FastbootDeviceInfo[]
}

export async function flashPartition(
  serial: string,
  partition: string,
  filePath: string,
): Promise<string> {
  return FlashPartition(serial, partition, filePath)
}

export async function wipeData(serial: string): Promise<string> {
  return WipeData(serial)
}

export async function getActiveSlot(serial: string): Promise<string> {
  return GetActiveSlot(serial)
}

export async function setActiveSlot(serial: string, slot: string): Promise<string> {
  return SetActiveSlot(serial, slot)
}

export async function runCustomFastbootCommand(
  serial: string,
  args: string,
): Promise<string> {
  return RunCustomFastbootCommand(serial, args)
}

export async function sideloadPackage(
  serial: string,
  zipPath: string,
): Promise<string> {
  return SideloadPackage(serial, zipPath)
}

export async function isUserspaceFastboot(serial: string): Promise<boolean> {
  return IsUserspaceFastboot(serial)
}

export async function selectFlashImageFile(): Promise<string> {
  return SelectFlashImageFile()
}

export async function selectSideloadFile(): Promise<string> {
  return SelectSideloadFile()
}

export async function selectRomFolder(): Promise<string> {
  return SelectDirectory()
}

export async function scanRomFolder(folderPath: string): Promise<FlashPlan> {
  const raw = await ScanRomFolder(folderPath)
  return raw as unknown as FlashPlan
}

export async function flashRomFolder(
  serial: string,
  folderPath: string,
  plan: FlashPlan,
): Promise<string> {
  const backendPlan = {
    steps: plan.steps.map((s) => ({
      partition: s.partition,
      image_file: s.image_file,
    })),
  }
  return FlashRomFolder(serial, folderPath, backendPlan)
}
