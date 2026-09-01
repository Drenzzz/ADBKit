import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  IconFileSearch as FileSearch,
  IconDownload as Download,
  IconCircleCheck as CheckCircle2,
  IconAlertTriangle as AlertTriangle,
  IconTerminal as Terminal
} from "@tabler/icons-react"
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

function CandidatePicker({
  candidates,
  selected,
  onSelect,
}: {
  candidates: BinaryInfo[]
  selected: string
  onSelect: (path: string) => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/40 bg-background p-3">
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
    </div>
  )
}

function BinaryRow({
  label,
  hint,
  state,
  version,
  candidates,
  selected,
  onPickCandidate,
  actions,
}: {
  label: string
  hint?: string
  state: RowState
  version?: string
  candidates: BinaryInfo[]
  selected: string
  onPickCandidate: (path: string) => void
  actions: React.ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-3 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusPill state={state} />
          {state === 'ready' && version && (
            <span className="text-[11px] text-muted-foreground">{version}</span>
          )}
        </div>
      </div>

      {!reduced && state === 'downloading' && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Progress value={50} className="h-1 rounded-full" />
        </motion.div>
      )}
      {reduced && state === 'downloading' && (
        <Progress value={50} className="h-1 rounded-full" />
      )}

      <AnimatePresence initial={false}>
        {state === 'missing' && candidates.length > 1 && (
          <motion.div
            key="candidates"
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <CandidatePicker
              candidates={candidates}
              selected={selected}
              onSelect={onPickCandidate}
            />
          </motion.div>
        )}

        {state === 'missing' && candidates.length <= 1 && (
          <motion.div
            key="actions"
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={reduced ? { duration: 0 } : { duration: 0.2 }}
          >
            {actions}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  )
}

export function PlatformToolsStep({ embedded = false }: { embedded?: boolean }) {
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

  const adbCandidates = status?.adbCandidates ?? []
  const fastbootCandidates = status?.fastbootCandidates ?? []

  const adbDownload = getState('adb')
  const fastbootDownload = getState('fastboot')

  const adbState: RowState = adbDownload.downloading
    ? 'downloading'
    : adbReady
      ? 'ready'
      : 'missing'
  const fastbootState: RowState = fastbootDownload.downloading
    ? 'downloading'
    : fastbootReady
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
          <Terminal className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Platform tools</h2>
          <p className="text-sm text-muted-foreground">ADB and Fastboot</p>
        </div>
      </div>

      {loading && <LoadingSkeleton />}

      <AnimatePresence initial={false}>
        {error && !scanned && !loading && (
          <motion.div
            key="scan-error"
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={reduced ? { duration: 0 } : { duration: 0.2 }}
            className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleScan} className="h-7 shrink-0 text-xs">
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {scanned && !loading && (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <BinaryRow
            label="ADB"
            hint="Android Debug Bridge"
            state={adbState}
            version={status?.adb?.version}
            candidates={adbCandidates}
            selected={status?.adb?.path ?? ''}
            onPickCandidate={(path) => void handlePickCandidate('adb', path)}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPlatformTools} className="h-7 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void handleSelectFile('adb')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                  <FileSearch className="h-3.5 w-3.5 mr-1" />
                  Link local file
                </Button>
              </div>
            }
          />
          <div className="border-t border-border/40">
            <BinaryRow
              label="Fastboot"
              hint="Bootloader flasher"
              state={fastbootState}
              version={status?.fastboot?.version}
              candidates={fastbootCandidates}
              selected={status?.fastboot?.path ?? ''}
              onPickCandidate={(path) => void handlePickCandidate('fastboot', path)}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPlatformTools} className="h-7 text-xs">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleSelectFile('fastboot')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                    <FileSearch className="h-3.5 w-3.5 mr-1" />
                    Link local file
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      )}

      {error && scanned && (
        <p className="text-sm text-muted-foreground">{error}</p>
      )}
    </motion.section>
  )
}