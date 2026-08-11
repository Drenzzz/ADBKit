import {
  DownloadPlatformTools,
  DownloadScrcpy,
} from '../../bindings/ADBKit/internal/app/app'
import { Events } from '@wailsio/runtime'

export interface DownloadProgressEvent {
  name: string
  percent: number
  bytesReceived: number
  bytesTotal: number
  status: string
}

export const DOWNLOAD_PROGRESS_EVENT = 'binary_download_progress'

export async function downloadPlatformTools(): Promise<void> {
  await DownloadPlatformTools()
}

export async function downloadScrcpy(): Promise<void> {
  await DownloadScrcpy()
}

export function onDownloadProgress(
  callback: (event: DownloadProgressEvent) => void,
): () => void {
  return Events.On(DOWNLOAD_PROGRESS_EVENT, (event) => {
    callback(event.data)
  })
}
