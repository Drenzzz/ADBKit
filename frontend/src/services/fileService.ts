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
} from '../../wailsjs/go/main/App'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import type { FileEntry, StorageInfo } from '@/lib/types'

export const FILE_TRANSFER_PROGRESS_EVENT = 'file_transfer_progress'

export interface FileTransferProgress {
  fileName: string
  direction: 'push' | 'pull'
  percent: number
}

export function onFileTransferProgress(
  callback: (progress: FileTransferProgress) => void,
): () => void {
  return EventsOn(FILE_TRANSFER_PROGRESS_EVENT, (progress: FileTransferProgress) => {
    callback(progress)
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
