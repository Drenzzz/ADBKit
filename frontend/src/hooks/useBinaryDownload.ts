import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  downloadPlatformTools,
  downloadScrcpy,
  onDownloadProgress,
  type DownloadProgressEvent,
} from '@/services/downloadService'

type DownloadName = 'adb' | 'fastboot' | 'scrcpy' | 'platform-tools'

interface DownloadState {
  downloading: boolean
  percent: number
  bytesReceived: number
  bytesTotal: number
  error: string | null
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export function useBinaryDownload() {
  const [state, setState] = useState<Record<string, DownloadState>>({})
  const activeRef = useRef<DownloadName | null>(null)

  useEffect(() => {
    const unsubscribe = onDownloadProgress((event: DownloadProgressEvent) => {
      if (event.name === 'platform-tools') {
        setState((prev) => ({
          ...prev,
          adb: {
            downloading: event.status !== 'done' && event.status !== 'error',
            percent: event.percent,
            bytesReceived: event.bytesReceived,
            bytesTotal: event.bytesTotal,
            error: event.status === 'error' ? 'Download failed' : null,
          },
          fastboot: {
            downloading: event.status !== 'done' && event.status !== 'error',
            percent: event.percent,
            bytesReceived: event.bytesReceived,
            bytesTotal: event.bytesTotal,
            error: event.status === 'error' ? 'Download failed' : null,
          },
        }))
        if (event.status === 'done') {
          activeRef.current = null
          toast.success('Platform tools downloaded', {
            description: 'ADB and Fastboot are ready.',
          })
        }
        if (event.status === 'error') {
          activeRef.current = null
          toast.error('Platform tools download failed')
        }
      } else if (event.name === 'scrcpy') {
        setState((prev) => ({
          ...prev,
          scrcpy: {
            downloading: event.status !== 'done' && event.status !== 'error',
            percent: event.percent,
            bytesReceived: event.bytesReceived,
            bytesTotal: event.bytesTotal,
            error: event.status === 'error' ? 'Download failed' : null,
          },
        }))
        if (event.status === 'done') {
          activeRef.current = null
          toast.success('scrcpy downloaded', {
            description: 'Screen mirroring is ready.',
          })
        }
        if (event.status === 'error') {
          activeRef.current = null
          toast.error('scrcpy download failed')
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const download = useCallback(async (name: DownloadName) => {
    activeRef.current = name
    setState((prev) => ({
      ...prev,
      [name === 'platform-tools' ? 'adb' : name]: {
        downloading: true,
        percent: 0,
        bytesReceived: 0,
        bytesTotal: 0,
        error: null,
      },
    }))

    try {
      if (name === 'platform-tools' || name === 'adb' || name === 'fastboot') {
        await downloadPlatformTools()
      } else {
        await downloadScrcpy()
      }
    } catch (err) {
      const msg = getErrorMessage(err)
      setState((prev) => ({
        ...prev,
        [name === 'platform-tools' ? 'adb' : name]: {
          downloading: false,
          percent: 0,
          bytesReceived: 0,
          bytesTotal: 0,
          error: msg,
        },
      }))
      toast.error('Download failed', { description: msg })
      activeRef.current = null
    }
  }, [])

  function getState(name: DownloadName): DownloadState {
    const key = name === 'platform-tools' ? 'adb' : name
    return (
      state[key] ?? {
        downloading: false,
        percent: 0,
        bytesReceived: 0,
        bytesTotal: 0,
        error: null,
      }
    )
  }

  return {
    getState,
    download,
    isDownloading: (name: DownloadName) => getState(name).downloading,
  }
}
