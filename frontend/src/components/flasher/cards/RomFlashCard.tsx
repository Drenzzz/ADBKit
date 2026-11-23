import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { FilePicker } from '@/components/flasher/shared/FilePicker'
import { RomPartitionList } from '@/components/flasher/shared/RomPartitionList'
import { Step } from '@/components/flasher/shared/Step'
import { useFlasher } from '@/hooks/useFlasher'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  IconLoader2,
} from "@tabler/icons-react"

interface RomFlashCardProps {
  disabled?: boolean
}

export function RomFlashCard({ disabled }: RomFlashCardProps) {
  const {
    activeFastbootSerial,
    romFolderPath,
    flashPlan,
    flashPlanSteps,
    selectedPartitions,
    scanningPlan,
    runningBatchFlash,
    chooseRomFolder,
    scanSelectedRomFolder,
    togglePartitionSelection,
    selectAllPartitions,
    deselectAllPartitions,
    executeBatchFlash,
  } = useFlasher()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const hasDevice = !!activeFastbootSerial && !disabled
  const hasPlan = flashPlan && flashPlanSteps.length > 0
  const selectedCount = selectedPartitions.length
  const partitionWord = selectedCount === 1 ? 'partition' : 'partitions'
  const completedCount = flashPlanSteps.filter((s) => s.status === 'success').length
  const progress = hasPlan ? (completedCount / flashPlanSteps.length) * 100 : 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-6">
        <h3 className="text-[32px] font-semibold tracking-tight text-[var(--color-text-primary)]">Flash ROM Folder</h3>
        <p className="mt-1 text-[16px] text-[var(--color-text-secondary)]">
          Scan a ROM folder, pick the partitions, flash them in one batch
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <Step n={1} label="Choose ROM folder">
          <div className="flex flex-col gap-3 sm:flex-row">
            <FilePicker
              value={romFolderPath}
              placeholder="Select ROM folder…"
              variant="folder"
              onBrowse={chooseRomFolder}
              disabled={disabled || runningBatchFlash}
              className="flex-1"
            />
            <button
              type="button"
              onClick={scanSelectedRomFolder}
              disabled={disabled || !romFolderPath || scanningPlan || runningBatchFlash}
              className="flex h-auto shrink-0 items-center justify-center gap-2 rounded-2xl border border-border/50 px-6 py-4 text-[16px] font-bold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 sm:w-48"
            >
              {scanningPlan && <IconLoader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none" />}
              {scanningPlan ? 'Scanning…' : 'Scan Folder'}
            </button>
          </div>
        </Step>

        {hasPlan ? (
          <Step n={2} label="Pick partitions to flash" fill>
            <RomPartitionList
              steps={flashPlanSteps}
              selectedPartitions={selectedPartitions}
              onToggle={togglePartitionSelection}
              onSelectAll={selectAllPartitions}
              onDeselectAll={deselectAllPartitions}
              disabled={disabled || runningBatchFlash}
            />
          </Step>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border/40 p-8">
            <p className="max-w-sm text-center text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
              {romFolderPath
                ? 'Scan the folder to list every flashable partition found inside.'
                : 'Point to a folder with .img files. The scan lists each partition it can flash.'}
            </p>
          </div>
        )}
      </div>

      <footer className="mt-6 flex flex-col gap-4 border-t border-border/40 pt-5">
        {runningBatchFlash && hasPlan && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[14px] font-semibold">
              <span className="text-[var(--color-text-secondary)]">Flashing progress</span>
              <span className="tabular-nums text-[var(--color-text-primary)]">{completedCount}/{flashPlanSteps.length}</span>
            </div>
            <ProgressBar label="Flashing progress" isLabelHidden value={progress} max={100} variant="accent" />
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="min-w-0 truncate text-[16px] text-[var(--color-text-secondary)]">
            {hasPlan ? `${selectedCount} ${partitionWord} selected` : 'No scan yet'}
          </p>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!hasDevice || !hasPlan || selectedCount === 0 || runningBatchFlash}
            className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-8 text-[16px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
          >
            {runningBatchFlash && <IconLoader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none" />}
            {runningBatchFlash ? 'Flashing ROM…' : `Flash ${selectedCount} ${partitionWord}`}
          </button>
        </div>
      </footer>

      {confirmOpen && (
        <ConfirmOverlay
          title="Confirm Batch Flash"
          body={`This will flash ${selectedCount} ${partitionWord} to the connected device. Make sure you selected the correct ROM folder. This action cannot be undone.`}
          confirmLabel={`Flash ${selectedCount} ${partitionWord}`}
          onConfirm={() => { setConfirmOpen(false); executeBatchFlash() }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export function ConfirmOverlay({ title, body, confirmLabel, onConfirm, onCancel, danger }: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={reduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduced ? { duration: 0.12 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border border-border/50 bg-card/95 p-8 backdrop-blur-2xl"
      >
        <h3 className="text-[22px] font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h3>
        <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-text-secondary)]">{body}</p>
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-[52px] rounded-full border border-border/50 px-7 text-[16px] font-bold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-[52px] rounded-full px-7 text-[16px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 ${danger ? 'bg-[var(--color-error)] focus-visible:outline-[var(--color-error)]' : 'bg-[var(--color-accent)] focus-visible:outline-[var(--color-accent)]'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}