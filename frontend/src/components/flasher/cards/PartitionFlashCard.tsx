import { FilePicker } from '@/components/flasher/shared/FilePicker'
import { PartitionChips } from '@/components/flasher/shared/PartitionChips'
import { Step } from '@/components/flasher/shared/Step'
import { useFlasher } from '@/hooks/useFlasher'
import { basename } from '@/lib/utils'
import {
  IconAlertTriangle,
  IconLoader2,
} from "@tabler/icons-react"

const LOGICAL_PARTITIONS = ['system', 'system_ext', 'vendor', 'product', 'odm', 'super', 'userdata']

interface PartitionFlashCardProps {
  disabled?: boolean
}

export function PartitionFlashCard({ disabled }: PartitionFlashCardProps) {
  const {
    activeFastbootSerial,
    selectedPartition,
    setSelectedPartition,
    selectedImagePath,
    isUserspace,
    runningFlash,
    chooseImageFile,
    executeFlashPartition,
  } = useFlasher()

  const needsUserspace =
    LOGICAL_PARTITIONS.includes(selectedPartition) && !isUserspace && !!activeFastbootSerial
  const canFlash =
    !!activeFastbootSerial && !!selectedPartition && !!selectedImagePath && !needsUserspace && !disabled

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-6">
        <h3 className="text-[32px] font-semibold tracking-tight text-[var(--color-text-primary)]">Flash Image</h3>
        <p className="mt-1 text-[16px] text-[var(--color-text-secondary)]">
          Write a single .img or .bin file to one partition
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pr-1">
        <Step n={1} label="Choose partition">
          <PartitionChips
            selected={selectedPartition}
            onSelect={setSelectedPartition}
            disabled={disabled || runningFlash}
          />
          <input
            placeholder="Or type a partition name…"
            value={selectedPartition}
            onChange={(e) => setSelectedPartition(e.target.value)}
            disabled={disabled || runningFlash}
            aria-label="Custom partition name"
            className="h-12 w-full rounded-full bg-[var(--color-surface-inset)] px-5 text-[16px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          />
        </Step>

        <Step n={2} label="Choose image file">
          <FilePicker
            value={selectedImagePath}
            placeholder="Select .img or .bin file…"
            variant="file-image"
            onBrowse={chooseImageFile}
            disabled={disabled || runningFlash}
          />
        </Step>

        {needsUserspace && (
          <div className="flex items-start gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] px-5 py-4">
            <IconAlertTriangle size={20} stroke={1.75} className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
            <p className="text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
              Logical partitions need fastbootd. Run{' '}
              <code className="rounded bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--color-text-primary)]">
                fastboot reboot fastboot
              </code>{' '}
              first.
            </p>
          </div>
        )}
      </div>

      <footer className="mt-6 flex items-center justify-between gap-4 border-t border-border/40 pt-5">
        <p className="min-w-0 truncate text-[16px] text-[var(--color-text-secondary)]">
          {selectedPartition && selectedImagePath
            ? `${selectedPartition} ← ${basename(selectedImagePath)}`
            : 'Pick a partition and an image to continue'}
        </p>
        <button
          type="button"
          onClick={executeFlashPartition}
          disabled={!canFlash || runningFlash}
          className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-8 text-[16px] font-bold text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {runningFlash && <IconLoader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none" />}
          {runningFlash ? 'Flashing…' : 'Flash Partition'}
        </button>
      </footer>
    </div>
  )
}