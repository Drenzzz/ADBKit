import {
  ListPackages,
  InstallPackage,
  UninstallPackage,
  UninstallMultiplePackages,
  EnablePackage,
  EnableMultiplePackages,
  DisablePackage,
  DisableMultiplePackages,
  ClearPackageData,
  PullPackageApk,
  LaunchPackage,
  ForceStopPackage,
  GetPackageDetails,
  SelectApkFile,
} from '../../bindings/ADBKit/internal/app/app'
import type {
  PackageDetails,
  PackageFilter,
  PackageInfo,
} from '@/lib/types'

export async function listPackages(filter: PackageFilter): Promise<PackageInfo[]> {
  const raw = await ListPackages(filter)
  return raw as unknown as PackageInfo[]
}

export async function installPackage(filePath: string): Promise<string> {
  return InstallPackage(filePath)
}

export async function uninstallPackage(packageName: string): Promise<string> {
  return UninstallPackage(packageName)
}

export async function uninstallMultiplePackages(packageNames: string[]): Promise<string> {
  return UninstallMultiplePackages(packageNames)
}

export async function enablePackage(packageName: string): Promise<string> {
  return EnablePackage(packageName)
}

export async function enableMultiplePackages(packageNames: string[]): Promise<string> {
  return EnableMultiplePackages(packageNames)
}

export async function disablePackage(packageName: string): Promise<string> {
  return DisablePackage(packageName)
}

export async function disableMultiplePackages(packageNames: string[]): Promise<string> {
  return DisableMultiplePackages(packageNames)
}

export async function clearPackageData(packageName: string): Promise<string> {
  return ClearPackageData(packageName)
}

export async function pullPackageApk(packageName: string): Promise<string> {
  return PullPackageApk(packageName)
}

export async function launchPackage(packageName: string): Promise<string> {
  return LaunchPackage(packageName)
}

export async function forceStopPackage(packageName: string): Promise<string> {
  return ForceStopPackage(packageName)
}

export async function getPackageDetails(packageName: string): Promise<PackageDetails> {
  const raw = await GetPackageDetails(packageName)
  return raw as unknown as PackageDetails
}

export async function selectApkFile(): Promise<string> {
  return SelectApkFile()
}
