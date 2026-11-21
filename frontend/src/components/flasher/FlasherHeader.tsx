import { useState } from 'react'
import {
  IconRefresh,
} from "@tabler/icons-react"
import { ConfirmOverlay } from '@/components/flasher/cards/RomFlashCard'
import { useFlasher } from '@/hooks/useFlasher'
import { cn } from '@/lib/utils'

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return ''
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}

const MODE_STYLES: Record<string, { dot: string; text: string }> = {
  fastbootd: { dot: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]' },
  fastboot: { dot: 'bg-[var(--color-accent)]', text: 'text-[var(--color-accent)]' },
  sideload: { dot: 'bg-[var(--color-warning)]', text: 'text-[var(--color-warning)]' },
}

export function FlasherHeader() {
  const {
    fastbootDevices,
    activeFastbootSerial,
    deviceMode,
    currentSlot,
    refreshingDevices,
    lastUpdatedAt,
    runningSlotChange,
    syncFastbootDevices,
    applyActiveSlot,
  } = useFlasher()

  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [pendingSlot, setPendingSlot] = useState('')

  const hasDevice = fastbootDevices.length > 0 || deviceMode === 'sideload'
  const hasSlot = (deviceMode === 'fastboot' || deviceMode === 'fastbootd') && (currentSlot === 'a' || currentSlot === 'b')
  const modeStyle = MODE_STYLES[deviceMode ?? ''] ?? { dot: 'bg-[var(--color-text-secondary)]', text: 'text-[var(--color-text-secondary)]' }

  function handleSlotSwitch(slot: string) {
    setPendingSlot(slot)
    setSlotDialogOpen(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2.5">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', modeStyle.dot, hasDevice && 'animate-pulse motion-reduce:animate-none')} />
            <span className="truncate text-[18px] font-bold text-[var(--color-text-primary)]">
              {hasDevice && activeFastbootSerial ? activeFastbootSerial : 'No device'}
            </span>
          </p>
          <p className={cn('mt-0.5 pl-5 text-[15px] font-bold', modeStyle.text)}>
            {hasDevice ? deviceMode || 'connected' : 'disconnected'}
          </p>
          {lastUpdatedAt && (
            <p className="pl-5 text-[14px] text-[var(--color-text-secondary)]">
              Refreshed {timeAgo(lastUpdatedAt)}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Refresh fastboot devices"
          onClick={() => syncFastbootDevices(true)}
          disabled={refreshingDevices}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          <IconRefresh
            size={18}
            stroke={1.75}
            className={refreshingDevices ? 'animate-spin motion-reduce:animate-none' : undefined}
          />
        </button>
      </div>

      {hasSlot && (
        <div className="flex items-center gap-0.5 rounded-full bg-[var(--color-surface-inset)] p-1">
          {(['a', 'b'] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => currentSlot !== slot && handleSlotSwitch(slot)}
              disabled={runningSlotChange}
              className={cn(
                'flex-1 rounded-full px-4 py-2 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-60',
                currentSlot === slot
                  ? 'bg-[var(--color-background-card)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              Slot {slot.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {slotDialogOpen && (
        <ConfirmOverlay
          title="Switch Active Slot"
          body={`Switch from slot ${currentSlot.toUpperCase()} to slot ${pendingSlot.toUpperCase()}? The device will boot from slot ${pendingSlot.toUpperCase()} on next restart.`}
          confirmLabel={`Switch to Slot ${pendingSlot.toUpperCase()}`}
          onConfirm={() => {
            applyActiveSlot(pendingSlot)
            setSlotDialogOpen(false)
          }}
          onCancel={() => setSlotDialogOpen(false)}
        />
      )}
    </div>
  )
}