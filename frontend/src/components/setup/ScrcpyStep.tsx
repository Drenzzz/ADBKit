import { useState } from 'react'
import { Search, FileSearch, Download, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { useBinaryDownload } from '@/hooks/useBinaryDownload'
import {
  getSetupState,
  selectBinaryFile,
  setCustomBinary,
} from '@/services/binaryService'
import type { BinaryInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

function ScrcpyCandidatePicker({
  candidates,
  selected,
  onSelect,
}: {
  candidates: BinaryInfo[]
  selected: string
  onSelect: (path: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        scrcpy — {candidates.length} found, pick one:
      </span>
      {candidates.map((candidate) => {
        const isSelected = selected === candidate.path
        return (
          <button
            key={candidate.path}
            type="button"
            onClick={() => onSelect(candidate.path)}
            className={cn(
              'flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
              isSelected
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border/50 hover:border-border',
            )}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground/80 uppercase">
                  {candidate.source}
                </span>
                {candidate.version && (
                  <Badge variant="outline" className="text-[9px]">
                    {candidate.version}
                  </Badge>
                )}
              </div>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {candidate.path}
              </span>
            </div>
            {isSelected && (
              <Badge variant="default" className="text-[9px] shrink-0">
                Selected
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return <Skeleton className="h-10 w-full" />
}

export function ScrcpyStep() {
  const { setupState, loading, error, nextStep, prevStep, setSetupState, setLoading, setError } =
    useSetupWizardStore()
  const { getState, download } = useBinaryDownload()
  const [scanned, setScanned] = useState(false)

  const handleScan = async () => {
    setLoading(true)
    setError(null)
    try {
      const state = await getSetupState()
      setSetupState(state)
      setScanned(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
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

  const handleDownloadScrcpy = async () => {
    await download('scrcpy')
    const state = await getSetupState()
    setSetupState(state)
  }

  const handlePickCandidate = async (path: string) => {
    try {
      await setCustomBinary('scrcpy', path)
      const state = await getSetupState()
      setSetupState(state)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Selection failed')
    }
  }

  const scrcpyInfo = setupState?.status?.scrcpy
  const scrcpyReady = scrcpyInfo?.status === 'ready'
  const scrcpyCandidates = setupState?.status?.scrcpyCandidates ?? []
  const scrcpyDownload = getState('scrcpy')

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

      {!scanned && !loading && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Click the button below to search for the scrcpy binary on your system.
          </p>
          <Button onClick={handleScan} size="lg">
            <Search className="h-4 w-4 mr-2" />
            Scan for scrcpy
          </Button>
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {scanned && !loading && (
        <>
          <div className="flex flex-col gap-3">
            {scrcpyReady ? (
              <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                <span className="text-sm font-medium">scrcpy</span>
                <div className="flex items-center gap-2">
                  {scrcpyInfo?.version && (
                    <Badge variant="default" className="text-[10px]">
                      {scrcpyInfo.version}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground/80 uppercase">
                    {scrcpyInfo?.source}
                  </span>
                </div>
              </div>
            ) : scrcpyDownload.downloading ? (
              <div className="flex flex-col gap-1.5 rounded-md border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">scrcpy</span>
                  <span className="text-[10px] text-muted-foreground">Downloading...</span>
                </div>
                <Progress value={scrcpyDownload.percent} className="h-1.5" />
              </div>
            ) : scrcpyCandidates.length > 1 ? (
              <ScrcpyCandidatePicker
                candidates={scrcpyCandidates}
                selected={scrcpyInfo?.path ?? ''}
                onSelect={handlePickCandidate}
              />
            ) : (
              <div className="flex flex-col gap-1.5 rounded-md border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">scrcpy</span>
                  <Badge variant="secondary" className="text-[10px]">not found</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadScrcpy} className="h-7 text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Download scrcpy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSelectFile} className="h-7 text-xs">
                    <FileSearch className="h-3 w-3 mr-1" />
                    Select file
                  </Button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {!scrcpyReady && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>scrcpy was not found on your system. Select the binary manually or install it and retry detection.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleScan} disabled={loading}>
              <Search className="h-3.5 w-3.5" />
              Re-scan
            </Button>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} disabled={!scrcpyReady || loading || scrcpyDownload.downloading}>
          Continue
        </Button>
      </div>
    </div>
  )
}
