import { useEffect, useCallback } from 'react'
import { RefreshCw, FolderOpen, FileSearch, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { useBinaryDownload } from '@/hooks/useBinaryDownload'
import {
  getSetupState,
  retryBinaryDetection,
  selectBinaryFile,
  selectPlatformToolsDirectory,
  setCustomBinary,
} from '@/services/binaryService'
import type { BinaryInfo } from '@/lib/types'

function BinaryRow({
  label,
  info,
  downloadState,
  onDownload,
  onSelectFile,
  loading,
}: {
  label: string
  info?: BinaryInfo
  downloadState: { downloading: boolean; percent: number }
  onDownload: () => void
  onSelectFile: () => void
  loading: boolean
}) {
  const status = info?.status ?? 'missing'
  const ready = status === 'ready'
  const missing = status === 'missing' || status === 'invalid_path'

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border/50 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge
          variant={ready ? 'default' : status === 'invalid_path' ? 'destructive' : 'secondary'}
          className="text-[10px]"
        >
          {ready ? info?.version ?? 'ready' : status}
        </Badge>
      </div>

      {downloadState.downloading && (
        <div className="flex flex-col gap-1">
          <Progress value={downloadState.percent} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">
            Downloading... {Math.round(downloadState.percent)}%
          </span>
        </div>
      )}

      {missing && !downloadState.downloading && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={loading}
            className="h-7 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectFile}
            disabled={loading}
            className="h-7 text-xs"
          >
            <FileSearch className="h-3 w-3 mr-1" />
            Select file
          </Button>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function PlatformToolsStep() {
  const { setupState, loading, error, nextStep, setSetupState, setLoading, setError } =
    useSetupWizardStore()
  const { getState, download } = useBinaryDownload()

  const detect = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const state = await getSetupState()
      setSetupState(state)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Detection failed')
    } finally {
      setLoading(false)
    }
  }, [setSetupState, setLoading, setError])

  useEffect(() => {
    detect()
  }, [detect])

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      await retryBinaryDetection()
      const state = await getSetupState()
      setSetupState(state)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFile = async (name: 'adb' | 'fastboot') => {
    try {
      const path = await selectBinaryFile(name)
      if (path) {
        await setCustomBinary(name, path)
        const state = await getSetupState()
        setSetupState(state)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Selection failed')
    }
  }

  const handleSelectFolder = async () => {
    try {
      const sel = await selectPlatformToolsDirectory()
      if (sel.directory) {
        await setCustomBinary('adb', sel.adbPath)
        await setCustomBinary('fastboot', sel.fastbootPath)
        const state = await getSetupState()
        setSetupState(state)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Folder selection failed')
    }
  }

  const handleDownloadPlatformTools = async () => {
    await download('platform-tools')
    const state = await getSetupState()
    setSetupState(state)
  }

  const adbReady = setupState?.status?.adb?.status === 'ready'
  const fastbootReady = setupState?.status?.fastboot?.status === 'ready'
  const canContinue = adbReady && fastbootReady

  const adbDownload = getState('adb')
  const fastbootDownload = getState('fastboot')

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Platform Tools</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ADB and Fastboot are required for all device operations.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex flex-col gap-2">
          <BinaryRow
            label="ADB"
            info={setupState?.status?.adb}
            downloadState={adbDownload}
            onDownload={handleDownloadPlatformTools}
            onSelectFile={() => void handleSelectFile('adb')}
            loading={loading}
          />
          <BinaryRow
            label="Fastboot"
            info={setupState?.status?.fastboot}
            downloadState={fastbootDownload}
            onDownload={handleDownloadPlatformTools}
            onSelectFile={() => void handleSelectFile('fastboot')}
            loading={loading}
          />
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
        <Button variant="outline" size="sm" onClick={handleSelectFolder} disabled={loading}>
          <FolderOpen className="h-3.5 w-3.5" />
          Select folder
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={nextStep} disabled={!canContinue || loading || adbDownload.downloading || fastbootDownload.downloading}>
          Continue
        </Button>
      </div>
    </div>
  )
}
