import {
  ScanDebloater,
  ListRestorablePackages,
  DebloatPackages,
  DisableDebloatPackages,
  RestorePackages,
  GetDebloaterCatalogMeta,
  ImportCustomDebloaterCatalog,
  ClearCustomDebloaterCatalog,
  ExportDebloaterTemplate,
  SelectJsonFile,
  SelectSaveJsonFile,
} from '../../bindings/ADBKit/internal/app/app'
import type {
  DebloatBatchResult,
  DebloatCatalogMeta,
  DebloatScanResult,
  RestorablePackage,
} from '@/lib/types'

export async function scanDebloater(): Promise<DebloatScanResult> {
  const raw = await ScanDebloater()
  const parsed = raw as unknown as DebloatScanResult
  return {
    ...parsed,
    items: parsed.items ?? [],
    presets: parsed.presets ?? [],
  }
}

export async function listRestorablePackages(): Promise<RestorablePackage[]> {
  const raw = await ListRestorablePackages()
  return (raw ?? []) as unknown as RestorablePackage[]
}

export async function debloatPackages(
  packageNames: string[],
  keepData: boolean,
): Promise<DebloatBatchResult> {
  const raw = await DebloatPackages(packageNames, keepData)
  return raw as unknown as DebloatBatchResult
}

export async function disableDebloatPackages(
  packageNames: string[],
): Promise<DebloatBatchResult> {
  const raw = await DisableDebloatPackages(packageNames)
  return raw as unknown as DebloatBatchResult
}

export async function restorePackages(
  packageNames: string[],
): Promise<DebloatBatchResult> {
  const raw = await RestorePackages(packageNames)
  return raw as unknown as DebloatBatchResult
}

export async function getDebloaterCatalogMeta(): Promise<DebloatCatalogMeta> {
  const raw = await GetDebloaterCatalogMeta()
  return raw as unknown as DebloatCatalogMeta
}

export async function importCustomDebloaterCatalog(
  filePath: string,
): Promise<DebloatCatalogMeta> {
  const raw = await ImportCustomDebloaterCatalog(filePath)
  return raw as unknown as DebloatCatalogMeta
}

export async function clearCustomDebloaterCatalog(): Promise<DebloatCatalogMeta> {
  const raw = await ClearCustomDebloaterCatalog()
  return raw as unknown as DebloatCatalogMeta
}

export async function exportDebloaterTemplate(filePath: string): Promise<string> {
  return ExportDebloaterTemplate(filePath)
}

export async function selectJsonFile(): Promise<string> {
  return SelectJsonFile()
}

export async function selectSaveJsonFile(defaultFilename: string): Promise<string> {
  return SelectSaveJsonFile(defaultFilename)
}
