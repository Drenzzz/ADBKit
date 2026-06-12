import {
  DownloadPlatformTools,
  DownloadScrcpy,
} from '../../wailsjs/go/main/App'
import { EventsOn } from '../../wailsjs/runtime/runtime'

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
  return EventsOn(DOWNLOAD_PROGRESS_EVENT, (event: DownloadProgressEvent) => {
    callback(event)
  })
}
