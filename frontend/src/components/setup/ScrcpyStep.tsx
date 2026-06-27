import { useState, useEffect } from 'react'
import { Search, FileSearch, Download, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react'
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
    <div className="flex flex-col gap-2 bg-muted/5 border border-border/40 p-3.5 rounded-xl">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Multiple candidates found for Scrcpy:
      </span>
      <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
        {candidates.map((candidate) => {
          const isSelected = selected === candidate.path
          return (
            <button
              key={candidate.path}
              type="button"
              onClick={() => onSelect(candidate.path)}
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all duration-150',
                isSelected
                  ? 'border-primary/45 bg-primary/5 text-foreground'
                  : 'border-border/40 hover:border-border bg-card/40',
              )}
            >
              <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-primary/75 uppercase tracking-wide">
                    {candidate.source}
                  </span>
                  {candidate.version && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-border">
                      {candidate.version}
                    </Badge>
                  )}
                </div>
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {candidate.path}
                </span>
              </div>
              {isSelected && (
                <Badge variant="default" className="text-[8px] uppercase tracking-wider shrink-0 select-none">
                  Active
                </Badge>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return <Skeleton className="h-14 w-full rounded-xl" />
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
  };

  // Perform auto-scan on mount if not done
  useEffect(() => {
    if (!scanned && !loading && setupState?.status?.scrcpy?.status !== 'ready') {
      void handleScan()
    } else if (setupState) {
      setScanned(true)
    }
  }, [setupState])

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
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Scrcpy Hub</h2>
          <Badge variant="outline" className="text-[8px] uppercase tracking-wider border-primary/20 text-primary bg-primary/5 px-1 py-0 select-none">
            Required
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
          Configure Scrcpy for screen mirroring, recording, and clipboard sync.
        </p>
      </div>

      {loading && <LoadingSkeleton />}

      {scanned && !loading && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border/50 bg-muted/5 divide-y divide-border/20 overflow-hidden">
            {/* Scrcpy Row */}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Scrcpy</span>
                  <span className="text-[10px] text-muted-foreground/60">(Screen Mirroring Utility)</span>
                </div>
                <div>
                  {scrcpyReady ? (
                    <Badge variant="outline" className="text-[9px] border-success/20 text-success bg-success/5 flex items-center gap-1 font-medium px-2 py-0">
                      <CheckCircle2 className="h-3 w-3" />
                      {scrcpyInfo?.version ?? 'ready'}
                    </Badge>
                  ) : scrcpyDownload.downloading ? (
                    <span className="text-[9px] uppercase tracking-wider text-primary font-medium">Downloading...</span>
                  ) : (
                    <Badge variant="outline" className="text-[9px] border-destructive/20 text-destructive bg-destructive/5 flex items-center gap-1 font-medium px-2 py-0">
                      <AlertCircle className="h-3 w-3" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </div>

              {scrcpyDownload.downloading && (
                <div className="mt-1">
                  <Progress value={scrcpyDownload.percent} className="h-1 rounded-full" />
                </div>
              )}

              {!scrcpyReady && !scrcpyDownload.downloading && scrcpyCandidates.length > 1 && (
                <ScrcpyCandidatePicker
                  candidates={scrcpyCandidates}
                  selected={scrcpyInfo?.path ?? ''}
                  onSelect={handlePickCandidate}
                />
              )}

              {!scrcpyReady && !scrcpyDownload.downloading && scrcpyCandidates.length <= 1 && (
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="sm" onClick={handleDownloadScrcpy} className="h-7 text-[10px] px-2.5">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download Scrcpy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSelectFile} className="h-7 text-[10px] px-2.5 text-muted-foreground hover:text-foreground">
                    <FileSearch className="h-3.5 w-3.5 mr-1" />
                    Link Local File...
                  </Button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}

          {!scrcpyReady && !scrcpyDownload.downloading && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs text-amber-600 dark:text-amber-400 leading-normal">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <span>Scrcpy binary is required to proceed. Link an existing binary manually or select automatic download.</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/10 pt-4 mt-2">
            <Button variant="ghost" size="sm" onClick={handleScan} disabled={loading} className="h-7 text-[10px] text-muted-foreground hover:text-foreground">
              <Search className="h-3.5 w-3.5 mr-1" />
              Refresh Scan
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={prevStep} className="h-8">
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={!scrcpyReady || loading || scrcpyDownload.downloading}
                size="sm"
                className="px-5 h-8 font-medium"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
