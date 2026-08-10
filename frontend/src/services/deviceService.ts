import {
  GetDevices,
  GetActiveSerial,
  SetActiveSerial,
  GetDeviceInfo,
  GetDeviceMode,
  RebootDevice,
  ConnectWireless,
  EnableWirelessTCPIP,
  DisconnectWireless,
  GetPerformanceSnapshot,
  GetDeviceNicknames,
  SetDeviceNickname,
  ClearDeviceNickname,
} from '../../bindings/ADBKit/app'
import type {
  DeviceSummary,
  DeviceInfo,
  DeviceMode,
  PerformanceSnapshot,
  DeviceNicknames,
} from '@/lib/types'

export async function getDevices(): Promise<DeviceSummary[]> {
  const raw = await GetDevices()
  return raw as unknown as DeviceSummary[]
}

export async function getActiveSerial(): Promise<string> {
  return GetActiveSerial()
}

export async function setActiveSerial(serial: string): Promise<void> {
  await SetActiveSerial(serial)
}

export async function getDeviceInfo(serial?: string): Promise<DeviceInfo> {
  const raw = await GetDeviceInfo(serial ?? '')
  return raw as unknown as DeviceInfo
}

export async function getDeviceMode(serial?: string): Promise<DeviceMode> {
  const raw = await GetDeviceMode(serial ?? '')
  return raw as unknown as DeviceMode
}

export async function rebootDevice(
  serial?: string,
  mode: string = 'system',
): Promise<string> {
  return RebootDevice(serial ?? '', mode)
}

export async function connectWireless(address: string): Promise<string> {
  return ConnectWireless(address)
}

export async function enableWirelessTCPIP(
  port: string,
  serial?: string,
): Promise<string> {
  return EnableWirelessTCPIP(port, serial ?? '')
}

export async function disconnectWireless(address: string): Promise<string> {
  return DisconnectWireless(address)
}

export async function getPerformanceSnapshot(
  serial?: string,
): Promise<PerformanceSnapshot> {
  const raw = await GetPerformanceSnapshot(serial ?? '')
  return raw as unknown as PerformanceSnapshot
}

export async function getDeviceNicknames(): Promise<DeviceNicknames> {
  const raw = await GetDeviceNicknames()
  return raw as unknown as DeviceNicknames
}

export async function setDeviceNickname(
  serial: string,
  nickname: string,
): Promise<void> {
  await SetDeviceNickname(serial, nickname)
}

export async function clearDeviceNickname(serial: string): Promise<void> {
  await ClearDeviceNickname(serial)
}
