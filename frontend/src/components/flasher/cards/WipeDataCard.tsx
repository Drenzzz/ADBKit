import { useState } from 'react'
import { ConfirmOverlay } from './RomFlashCard'
import { useFlasher } from '@/hooks/useFlasher'
import {
  IconAlertTriangle,
  IconLoader2,
} from "@tabler/icons-react"

interface WipeDataCardProps {
  disabled?: boolean
}

const ERASED_ITEMS = ['All user data and personal files', 'Installed apps and their data', 'Accounts and device settings']

export function WipeDataCard({ disabled }: WipeDataCardProps) {
  const { activeFastbootSerial, runningWipe, executeWipeData } = useFlasher()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const hasDevice = !!activeFastbootSerial && !disabled

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-6">
        <h3 className="flex items-center gap-3 text-[32px] font-semibold tracking-tight text-[var(--color-error)]">
          <IconAlertTriangle size={20} stroke={1.75} />
          Wipe Data
        </h3>
        <p className="mt-1 text-[16px] text-[var(--color-text-secondary)]">
          Permanent factory reset over fastboot, cannot be undone
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">This erases:</p>
        <ul className="space-y-3">
          {ERASED_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3.5 rounded-2xl bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-5 py-4 text-[16px] font-medium text-[var(--color-text-primary)]"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-error)]" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
          Back up anything you need first. After the wipe the device boots to the setup screen.
        </p>
      </div>

      <footer className="mt-6 border-t border-[color-mix(in_srgb,var(--color-error)_25%,transparent)] pt-5">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!hasDevice || runningWipe}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--color-error)] text-[16px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)] disabled:opacity-40"
        >
          {runningWipe && <IconLoader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none" />}
          {runningWipe ? 'Wiping device…' : 'Wipe Everything (Factory Reset)'}
        </button>
      </footer>

      {confirmOpen && (
        <ConfirmOverlay
          title="Confirm Factory Reset"
          body="This will erase ALL user data, installed apps, and accounts on the device. This action is permanent and cannot be undone."
          confirmLabel="Wipe Everything"
          danger
          onConfirm={() => { setConfirmOpen(false); executeWipeData() }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}