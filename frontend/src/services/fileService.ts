import {
  ListFiles,
  GetDirectorySize,
  GetStorageInfo,
  PullFile,
  PullMultipleFiles,
  PushFile,
  PushMultipleFiles,
  DeleteFile,
  DeleteMultipleFiles,
  CreateDirectory,
  RenameFile,
  SelectFile,
  SelectDirectory,
  SelectMultipleFiles,
  CancelFileTransfer,
  ListSdCards,
  UnblockPath,
} from '../../bindings/ADBKit/internal/app/app'
import { Events } from '@wailsio/runtime'
import type { FileEntry, StorageInfo, SdCard, UnblockResult } from '@/lib/types'

export const FILE_TRANSFER_PROGRESS_EVENT = 'file_transfer_progress'

export interface FileTransferProgress {
  fileName: string
  direction: 'push' | 'pull'
  percent: number
}

export function onFileTransferProgress(
  callback: (progress: FileTransferProgress) => void,
): () => void {
  return Events.On(FILE_TRANSFER_PROGRESS_EVENT, (event) => {
    callback(event.data)
  })
}

export async function listFiles(remotePath: string, showHidden: boolean): Promise<FileEntry[]> {
  const raw = await ListFiles(remotePath, showHidden)
  return raw as unknown as FileEntry[]
}

export async function getDirectorySize(remotePath: string): Promise<string> {
  return GetDirectorySize(remotePath)
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const raw = await GetStorageInfo()
  return raw as unknown as StorageInfo
}

export async function selectFile(): Promise<string> {
  return SelectFile()
}

export async function selectMultipleFiles(): Promise<string[]> {
  const raw = await SelectMultipleFiles()
  return raw as unknown as string[]
}

export async function selectDirectory(): Promise<string> {
  return SelectDirectory()
}

export async function pullFile(remotePath: string, localPath: string): Promise<string> {
  return PullFile(remotePath, localPath)
}

export async function pullMultipleFiles(remotePaths: string[], localDirectory: string): Promise<string> {
  return PullMultipleFiles(remotePaths, localDirectory)
}

export async function pushFile(localPath: string, remotePath: string): Promise<string> {
  return PushFile(localPath, remotePath)
}

export async function pushMultipleFiles(localPaths: string[], remoteDirectory: string): Promise<string> {
  return PushMultipleFiles(localPaths, remoteDirectory)
}

export async function deleteFile(remotePath: string): Promise<string> {
  return DeleteFile(remotePath)
}

export async function deleteMultipleFiles(remotePaths: string[]): Promise<string> {
  return DeleteMultipleFiles(remotePaths)
}

export async function createDirectory(remotePath: string): Promise<string> {
  return CreateDirectory(remotePath)
}

export async function renameFile(oldRemotePath: string, newRemotePath: string): Promise<string> {
  return RenameFile(oldRemotePath, newRemotePath)
}

export function cancelFileTransfer(): void {
  CancelFileTransfer()
}

// listSdCards calls adb shell sm list-volumes and returns mounted volumes.
export async function listSdCards(): Promise<SdCard[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (ListSdCards as (...args: unknown[]) => Promise<unknown>)('')
  return raw as SdCard[]
}

// unblockPath returns honest guidance for recovering access to a blocked path.
// No fake bypass — tells the user exactly what they need to do on their device.
export async function unblockPath(remotePath: string): Promise<UnblockResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (UnblockPath as (...args: unknown[]) => Promise<unknown>)(remotePath)
  return raw as UnblockResult
}
