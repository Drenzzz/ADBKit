import {
  ListPackages,
  InstallPackage,
  InspectAPK,
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
  GetPackagePermissions,
  SetPackagePermission,
  SetPackageAppOp,
  GetAppIcon,
  GetAppLabels,
  GetAppIcons,
  SelectApkFile,
} from '../../bindings/ADBKit/internal/app/app'
import type {
  APKPreview,
  PackageDetails,
  PackageFilter,
  PackageInfo,
  PackagePermissionsReport,
} from '@/lib/types'

export async function listPackages(filter: PackageFilter): Promise<PackageInfo[]> {
  const raw = await ListPackages(filter)
  return raw as unknown as PackageInfo[]
}

export async function installPackage(filePath: string): Promise<string> {
  return InstallPackage(filePath)
}

export async function inspectAPK(filePath: string): Promise<APKPreview> {
  const raw = await InspectAPK(filePath)
  return raw as unknown as APKPreview
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

export interface AppIcon {
  packageName: string
  label: string
  iconDataURL: string
}

export async function getAppIcon(packageName: string): Promise<AppIcon> {
  const raw = await GetAppIcon(packageName)
  return raw as unknown as AppIcon
}

export async function getAppLabels(packageNames: string[]): Promise<Record<string, string>> {
  const raw = await GetAppLabels(packageNames)
  return (raw ?? {}) as Record<string, string>
}

export async function getAppIcons(packageNames: string[]): Promise<Record<string, AppIcon>> {
  const raw = await GetAppIcons(packageNames)
  return (raw ?? {}) as Record<string, AppIcon>
}

export async function selectApkFile(): Promise<string> {
  return SelectApkFile()
}

export async function getPackagePermissions(packageName: string): Promise<PackagePermissionsReport> {
  const raw = await GetPackagePermissions(packageName)
  return raw as unknown as PackagePermissionsReport
}

export async function setPackagePermission(packageName: string, permissionName: string, granted: boolean): Promise<string> {
  return SetPackagePermission(packageName, permissionName, granted)
}

export async function setPackageAppOp(packageName: string, opName: string, mode: string): Promise<string> {
  return SetPackageAppOp(packageName, opName, mode)
}
