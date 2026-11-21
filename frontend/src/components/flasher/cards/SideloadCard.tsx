import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { FilePicker } from '@/components/flasher/shared/FilePicker'
import { Step } from '@/components/flasher/shared/Step'
import { ConfirmOverlay } from './RomFlashCard'
import { useFlasher } from '@/hooks/useFlasher'
import { basename } from '@/lib/utils'
import {
  IconInfoCircle,
  IconLoader2,
} from "@tabler/icons-react"

interface SideloadCardProps {
  disabled?: boolean
}

export function SideloadCard({ disabled }: SideloadCardProps) {
  const {
    activeFastbootSerial,
    sideloadFilePath,
    runningSideload,
    chooseSideloadFile,
    executeSideload,
  } = useFlasher()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const hasDevice = !!activeFastbootSerial
  const hasFile = !!sideloadFilePath

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-6">
        <h3 className="text-[32px] font-semibold tracking-tight text-[var(--color-text-primary)]">Sideload Package</h3>
        <p className="mt-1 text-[16px] text-[var(--color-text-secondary)]">
          Push a ZIP to the device through recovery sideload
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pr-1">
        <Step n={1} label="Choose ZIP package">
          <FilePicker
            value={sideloadFilePath}
            placeholder="Select .zip file for sideload…"
            variant="file"
            onBrowse={chooseSideloadFile}
            disabled={disabled || runningSideload}
          />
        </Step>

        <div className="flex shrink-0 items-start gap-3 rounded-2xl bg-[var(--color-surface-inset)] px-5 py-4">
          <IconInfoCircle size={20} stroke={1.75} className="mt-0.5 shrink-0 text-[var(--color-text-secondary)]" />
          <p className="text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
            The device must be in recovery with sideload active. The transfer can take several
            minutes for a full ROM; keep the USB cable connected until it finishes.
          </p>
        </div>

        {runningSideload && (
          <div className="shrink-0 space-y-2 rounded-2xl bg-[var(--color-surface-inset)] p-5">
            <span className="flex items-center gap-2 text-[16px] font-semibold text-[var(--color-text-secondary)]">
              <IconLoader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none text-[var(--color-accent)]" />
              Sideloading in progress…
            </span>
            <Progress value={null} className="h-2 animate-pulse motion-reduce:animate-none" />
          </div>
        )}
      </div>

      <footer className="mt-6 flex items-center justify-between gap-4 border-t border-border/40 pt-5">
        <p className="min-w-0 truncate text-[16px] text-[var(--color-text-secondary)]">
          {hasFile ? basename(sideloadFilePath) : 'Pick a ZIP package to continue'}
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={disabled || !hasDevice || !hasFile || runningSideload}
          className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-8 text-[16px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          {runningSideload && <IconLoader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none" />}
          {runningSideload ? 'Sideloading…' : 'Sideload Package'}
        </button>
      </footer>

      {confirmOpen && (
        <ConfirmOverlay
          title="Confirm Sideload"
          body="This will push the selected ZIP to the device via recovery sideload. The device must be in sideload/recovery mode."
          confirmLabel="Start Sideload"
          onConfirm={() => { setConfirmOpen(false); executeSideload() }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}