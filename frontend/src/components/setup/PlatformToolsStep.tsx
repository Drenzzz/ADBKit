import { useState } from 'react'
import { Search, FolderOpen, FileSearch, Download } from 'lucide-react'
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
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label} — {candidates.length} found, pick one:
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
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Platform Tools</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ADB and Fastboot are required for all device operations.
        </p>
      </div>

      {!scanned && !loading && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Click the button below to search for ADB and Fastboot binaries on your system.
          </p>
          <Button onClick={handleScan} size="lg">
            <Search className="h-4 w-4 mr-2" />
            Scan for binaries
          </Button>
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {scanned && !loading && (
        <>
          <div className="flex flex-col gap-3">
            {adbReady ? (
              <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                <span className="text-sm font-medium">ADB</span>
                <Badge variant="default" className="text-[10px]">
                  {status?.adb?.version ?? 'ready'}
                </Badge>
              </div>
            ) : adbDownload.downloading ? (
              <div className="flex flex-col gap-1.5 rounded-md border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ADB</span>
                  <span className="text-[10px] text-muted-foreground">Downloading...</span>
                </div>
                <Progress value={adbDownload.percent} className="h-1.5" />
              </div>
            ) : adbCandidates.length > 1 ? (
              <CandidatePicker
                label="ADB"
                candidates={adbCandidates}
                selected={status?.adb?.path ?? ''}
                onSelect={(path) => void handlePickCandidate('adb', path)}
              />
            ) : (
              <div className="flex flex-col gap-1.5 rounded-md border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ADB</span>
                  <Badge variant="secondary" className="text-[10px]">not found</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPlatformTools} className="h-7 text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleSelectFile('adb')} className="h-7 text-xs">
                    <FileSearch className="h-3 w-3 mr-1" />
                    Select file
                  </Button>
                </div>
              </div>
            )}

            {fastbootReady ? (
              <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                <span className="text-sm font-medium">Fastboot</span>
                <Badge variant="default" className="text-[10px]">
                  {status?.fastboot?.version ?? 'ready'}
                </Badge>
              </div>
            ) : fastbootDownload.downloading ? (
              <div className="flex flex-col gap-1.5 rounded-md border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fastboot</span>
                  <span className="text-[10px] text-muted-foreground">Downloading...</span>
                </div>
                <Progress value={fastbootDownload.percent} className="h-1.5" />
              </div>
            ) : fastbootCandidates.length > 1 ? (
              <CandidatePicker
                label="Fastboot"
                candidates={fastbootCandidates}
                selected={status?.fastboot?.path ?? ''}
                onSelect={(path) => void handlePickCandidate('fastboot', path)}
              />
            ) : (
              <div className="flex flex-col gap-1.5 rounded-md border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fastboot</span>
                  <Badge variant="secondary" className="text-[10px]">not found</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPlatformTools} className="h-7 text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleSelectFile('fastboot')} className="h-7 text-xs">
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

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleScan} disabled={loading}>
              <Search className="h-3.5 w-3.5" />
              Re-scan
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectFolder} disabled={loading}>
              <FolderOpen className="h-3.5 w-3.5" />
              Select folder
            </Button>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button
          onClick={nextStep}
          disabled={!canContinue || loading || adbDownload.downloading || fastbootDownload.downloading}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
