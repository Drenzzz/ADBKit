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
  FastbootContinue,
  WakeScreen,
  WakeAndUnlock,
  SetStayAwakeWhileCharging,
  GetStayAwakeWhileCharging,
} from '../../bindings/ADBKit/app'
import { Events } from '@wailsio/runtime'
import type { FastbootDeviceInfo, FlashPlan } from '@/lib/types'

export const FLASH_STEP_STATUS_EVENT = 'flash_step_status'

export interface FlashStepStatusEvent {
  partition: string
  status: 'flashing' | 'success' | 'error'
  message: string
}

export function onFlashStepStatus(
  callback: (event: FlashStepStatusEvent) => void,
): () => void {
  return Events.On(FLASH_STEP_STATUS_EVENT, (event) => {
    callback(event.data)
  })
}

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

// WOF (Wake on Fastboot): boot out of fastboot without a physical Start press.
export async function fastbootContinue(serial: string): Promise<string> {
  return FastbootContinue(serial)
}

// WOF: wake the device screen via KEYCODE_WAKEUP (power-button replacement).
export async function wakeScreen(serial: string): Promise<string> {
  return WakeScreen(serial)
}

// WOF: wake + dismiss non-secure keyguard in one call.
export async function wakeAndUnlock(serial: string): Promise<string> {
  return WakeAndUnlock(serial)
}

// WOF: toggle "Stay awake while charging" developer option.
export async function setStayAwakeWhileCharging(
  serial: string,
  enabled: boolean,
): Promise<string> {
  return SetStayAwakeWhileCharging(serial, enabled)
}

export async function getStayAwakeWhileCharging(serial: string): Promise<boolean> {
  return GetStayAwakeWhileCharging(serial)
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
