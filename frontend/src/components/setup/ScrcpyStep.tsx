import { useEffect, useCallback } from 'react'
import { RefreshCw, FileSearch, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import {
  getSetupState,
  retryBinaryDetection,
  selectBinaryFile,
  setCustomBinary,
} from '@/services/binaryService'

function LoadingSkeleton() {
  return <Skeleton className="h-10 w-full" />
}

export function ScrcpyStep() {
  const { setupState, loading, error, nextStep, prevStep, setSetupState, setLoading, setError } =
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

  const handleSelectFile = async () => {
    try {
      const path = await selectBinaryFile('scrcpy')
      if (path) {
        await setCustomBinary('scrcpy', path)
        const state = await getSetupState()
        setSetupState(state)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Selection failed')
    }
  }

  const scrcpyInfo = setupState?.status?.scrcpy
  const scrcpyReady = scrcpyInfo?.status === 'ready'

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-lg font-semibold">Scrcpy</h2>
          <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">
            Required
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Screen mirroring, recording, and clipboard sync need scrcpy. The wizard cannot continue without it.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
          <span className="text-sm font-medium">scrcpy</span>
          {scrcpyInfo ? (
            <Badge
              variant={scrcpyReady ? 'default' : scrcpyInfo.status === 'invalid_path' ? 'destructive' : 'secondary'}
              className="text-[10px]"
            >
              {scrcpyReady ? scrcpyInfo.version ?? 'ready' : scrcpyInfo.status}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              missing
            </Badge>
          )}
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {!loading && !scrcpyReady && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>scrcpy was not found on your system. Select the binary manually or install it and retry detection.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
        <Button variant="outline" size="sm" onClick={handleSelectFile} disabled={loading}>
          <FileSearch className="h-3.5 w-3.5" />
          Select scrcpy
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} disabled={!scrcpyReady || loading}>
          Continue
        </Button>
      </div>
    </div>
  )
}
