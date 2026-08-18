import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  FileSearch,
  Download,
  CheckCircle2,
  AlertTriangle,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { useBinaryDownload } from '@/hooks/useBinaryDownload'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  getSetupState,
  selectBinaryFile,
  setCustomBinary,
} from '@/services/binaryService'
import type { BinaryInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

type RowState = 'ready' | 'missing' | 'downloading'

function StatusPill({ state }: { state: RowState }) {
  const map: Record<RowState, { classes: string; dot: string; label: string }> = {
    ready: {
      classes: 'text-emerald-600 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      label: 'Ready',
    },
    missing: {
      classes: 'text-muted-foreground',
      dot: 'bg-muted-foreground/40',
      label: 'Missing',
    },
    downloading: {
      classes: 'text-primary',
      dot: 'bg-primary',
      label: 'Downloading',
    },
  }
  const entry = map[state]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-200',
        entry.classes,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', entry.dot)} aria-hidden />
      {entry.label}
    </span>
  )
}

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
      {candidates.map((candidate) => {
        const isSelected = selected === candidate.path
        return (
          <button
            key={candidate.path}
            type="button"
            onClick={() => onSelect(candidate.path)}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors duration-150',
              isSelected
                ? 'border-foreground/40 bg-foreground/[0.04] text-foreground'
                : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground',
            )}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs text-foreground">{candidate.source}</span>
              <span className="truncate text-xs text-muted-foreground">{candidate.path}</span>
            </div>
            {isSelected && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-foreground" />
            )}
          </button>
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return <Skeleton className="h-24 w-full rounded-xl" />
}

export function ScrcpyStep({ embedded = false, autoScan = true }: { embedded?: boolean; autoScan?: boolean }) {
  const { setupState, loading, error, setSetupState, setLoading, setError } =
    useSetupWizardStore()
  const { getState, download } = useBinaryDownload()
  const [scanned, setScanned] = useState(false)
  const reduced = useReducedMotion()

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

  useEffect(() => {
    if (!autoScan) {
      if (setupState) setScanned(true)
      return
    }
    if (!scanned && !loading && setupState?.status?.scrcpy?.status !== 'ready') {
      void handleScan()
    } else if (setupState) {
      setScanned(true)
    }
  }, [autoScan, setupState])

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

  const state: RowState = scrcpyDownload.downloading
    ? 'downloading'
    : scrcpyReady
      ? 'ready'
      : 'missing'

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      className={cn('flex w-full flex-col gap-4 text-left', embedded && 'gap-3')}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
          <Monitor className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Scrcpy</h2>
          <p className="text-sm text-muted-foreground">Screen mirroring and clipboard sync</p>
        </div>
      </div>

      {loading && <LoadingSkeleton />}

      {scanned && !loading && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">Scrcpy</span>
              <span className="text-xs text-muted-foreground">Screen mirroring utility</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusPill state={state} />
              {state === 'ready' && scrcpyInfo?.version && (
                <span className="text-[11px] text-muted-foreground">{scrcpyInfo.version}</span>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {state === 'downloading' && (
              <motion.div
                key="progress"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.2 }}
              >
                <Progress value={50} className="h-1 rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {state === 'missing' && scrcpyCandidates.length > 1 && (
              <motion.div
                key="candidates"
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <ScrcpyCandidatePicker
                  candidates={scrcpyCandidates}
                  selected={scrcpyInfo?.path ?? ''}
                  onSelect={handlePickCandidate}
                />
              </motion.div>
            )}

            {state === 'missing' && scrcpyCandidates.length <= 1 && (
              <motion.div
                key="actions"
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                className="flex flex-wrap items-center gap-2"
              >
                <Button variant="outline" size="sm" onClick={handleDownloadScrcpy} className="h-7 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download Scrcpy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSelectFile} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                  <FileSearch className="h-3.5 w-3.5 mr-1" />
                  Link local file
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-sm text-muted-foreground">{error}</p>
          )}

          <AnimatePresence initial={false}>
            {state === 'missing' && (
              <motion.div
                key="warning"
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                className="flex items-start gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Scrcpy is required to proceed. Link an existing binary or use automatic download.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.section>
  )
}