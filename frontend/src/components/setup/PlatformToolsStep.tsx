import { useEffect, useCallback } from 'react'
import { RefreshCw, FolderOpen, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import {
  getSetupState,
  retryBinaryDetection,
  selectBinaryFile,
  selectPlatformToolsDirectory,
  setCustomBinary,
} from '@/services/binaryService'
import type { BinaryInfo } from '@/lib/types'

function BinaryRow({ label, info }: { label: string; info?: BinaryInfo }) {
  const status = info?.status ?? 'missing'
  const variant =
    status === 'ready'
      ? 'default'
      : status === 'invalid_path'
        ? 'destructive'
        : 'secondary'

  return (
    <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      {info ? (
        <Badge variant={variant} className="text-[10px]">
          {status === 'ready' ? info.version ?? 'ready' : status}
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-[10px]">
          missing
        </Badge>
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

  const adbReady = setupState?.status?.adb?.status === 'ready'
  const fastbootReady = setupState?.status?.fastboot?.status === 'ready'
  const canContinue = adbReady && fastbootReady

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
          <BinaryRow label="ADB" info={setupState?.status?.adb} />
          <BinaryRow label="Fastboot" info={setupState?.status?.fastboot} />
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
        <Button variant="outline" size="sm" onClick={() => handleSelectFile('adb')} disabled={loading}>
          <FileSearch className="h-3.5 w-3.5" />
          Select adb
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleSelectFile('fastboot')} disabled={loading}>
          <FileSearch className="h-3.5 w-3.5" />
          Select fastboot
        </Button>
        <Button variant="outline" size="sm" onClick={handleSelectFolder} disabled={loading}>
          <FolderOpen className="h-3.5 w-3.5" />
          Select folder
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={nextStep} disabled={!canContinue || loading}>
          Continue
        </Button>
      </div>
    </div>
  )
}
