import { useState, useEffect } from 'react'
import { Search, FolderOpen, FileSearch, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { useBinaryDownload } from '@/hooks/useBinaryDownload'
import {
  getSetupState,
  selectBinaryFile,
  selectPlatformToolsDirectory,
  setCustomBinary,
} from '@/services/binaryService'
import type { BinaryInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

function CandidatePicker({
  label,
  candidates,
  selected,
  onSelect,
}: {
  label: string
  candidates: BinaryInfo[]
  selected: string
  onSelect: (path: string) => void
}) {
  return (
    <div className="flex flex-col gap-2 bg-muted/5 border border-border/40 p-3.5 rounded-xl">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Multiple candidates found for {label}:
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
                'flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors duration-150',
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
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  )
}

export function PlatformToolsStep() {
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

  // Perform auto-scan if not scanned yet
  useEffect(() => {
    if (!scanned && !loading && !setupState) {
      void handleScan()
    } else if (setupState) {
      setScanned(true)
    }
  }, [setupState])

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

  const handlePickCandidate = async (name: 'adb' | 'fastboot', path: string) => {
    try {
      await setCustomBinary(name, path)
      const state = await getSetupState()
      setSetupState(state)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Selection failed')
    }
  }

  const status = setupState?.status
  const adbReady = status?.adb?.status === 'ready'
  const fastbootReady = status?.fastboot?.status === 'ready'
  const canContinue = adbReady && fastbootReady

  const adbCandidates = status?.adbCandidates ?? []
  const fastbootCandidates = status?.fastbootCandidates ?? []

  const adbDownload = getState('adb')
  const fastbootDownload = getState('fastboot')

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Platform Tools</h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
          Configure ADB and Fastboot binaries. You can automatically download managed versions or link existing local system tools.
        </p>
      </div>

      {loading && <LoadingSkeleton />}

      {scanned && !loading && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border/50 bg-muted/5 divide-y divide-border/20 overflow-hidden">
            {/* ADB Row */}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">ADB</span>
                  <span className="text-[10px] text-muted-foreground/60">(Android Debug Bridge)</span>
                </div>
                <div>
                  {adbReady ? (
                    <Badge variant="outline" className="text-[9px] border-success/20 text-success bg-success/5 flex items-center gap-1 font-medium px-2 py-0">
                      <CheckCircle2 className="h-3 w-3" />
                      {status?.adb?.version ?? 'ready'}
                    </Badge>
                  ) : adbDownload.downloading ? (
                    <span className="text-[9px] uppercase tracking-wider text-primary font-medium">Downloading...</span>
                  ) : (
                    <Badge variant="outline" className="text-[9px] border-destructive/20 text-destructive bg-destructive/5 flex items-center gap-1 font-medium px-2 py-0">
                      <AlertCircle className="h-3 w-3" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </div>

              {adbDownload.downloading && (
                <div className="mt-1">
                  <Progress value={adbDownload.percent} className="h-1 rounded-full" />
                </div>
              )}

              {!adbReady && !adbDownload.downloading && adbCandidates.length > 1 && (
                <CandidatePicker
                  label="ADB"
                  candidates={adbCandidates}
                  selected={status?.adb?.path ?? ''}
                  onSelect={(path) => void handlePickCandidate('adb', path)}
                />
              )}

              {!adbReady && !adbDownload.downloading && adbCandidates.length <= 1 && (
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="sm" onClick={handleDownloadPlatformTools} className="h-7 text-[10px] px-2.5">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download Tools
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleSelectFile('adb')} className="h-7 text-[10px] px-2.5 text-muted-foreground hover:text-foreground">
                    <FileSearch className="h-3.5 w-3.5 mr-1" />
                    Link Local File...
                  </Button>
                </div>
              )}
            </div>

            {/* Fastboot Row */}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Fastboot</span>
                  <span className="text-[10px] text-muted-foreground/60">(Bootloader Flasher)</span>
                </div>
                <div>
                  {fastbootReady ? (
                    <Badge variant="outline" className="text-[9px] border-success/20 text-success bg-success/5 flex items-center gap-1 font-medium px-2 py-0">
                      <CheckCircle2 className="h-3 w-3" />
                      {status?.fastboot?.version ?? 'ready'}
                    </Badge>
                  ) : fastbootDownload.downloading ? (
                    <span className="text-[9px] uppercase tracking-wider text-primary font-medium">Downloading...</span>
                  ) : (
                    <Badge variant="outline" className="text-[9px] border-destructive/20 text-destructive bg-destructive/5 flex items-center gap-1 font-medium px-2 py-0">
                      <AlertCircle className="h-3 w-3" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </div>

              {fastbootDownload.downloading && (
                <div className="mt-1">
                  <Progress value={fastbootDownload.percent} className="h-1 rounded-full" />
                </div>
              )}

              {!fastbootReady && !fastbootDownload.downloading && fastbootCandidates.length > 1 && (
                <CandidatePicker
                  label="Fastboot"
                  candidates={fastbootCandidates}
                  selected={status?.fastboot?.path ?? ''}
                  onSelect={(path) => void handlePickCandidate('fastboot', path)}
                />
              )}

              {!fastbootReady && !fastbootDownload.downloading && fastbootCandidates.length <= 1 && (
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="sm" onClick={handleDownloadPlatformTools} className="h-7 text-[10px] px-2.5">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download Tools
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleSelectFile('fastboot')} className="h-7 text-[10px] px-2.5 text-muted-foreground hover:text-foreground">
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

          <div className="flex items-center justify-between border-t border-border/10 pt-4 mt-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleScan} disabled={loading} className="h-7 text-[10px] text-muted-foreground hover:text-foreground">
                <Search className="h-3.5 w-3.5 mr-1" />
                Refresh Scan
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSelectFolder} disabled={loading} className="h-7 text-[10px] text-muted-foreground hover:text-foreground">
                <FolderOpen className="h-3.5 w-3.5 mr-1" />
                Select platform-tools folder
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={prevStep} className="h-8">
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={!canContinue || loading || adbDownload.downloading || fastbootDownload.downloading}
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
