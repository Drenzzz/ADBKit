import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RefreshCw } from 'lucide-react'
import { useFlasher } from '@/hooks/useFlasher'
import { cn } from '@/lib/utils'

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return ''
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
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
  const isSideload = deviceMode === 'sideload'

  function handleSlotSwitch(slot: string) {
    setPendingSlot(slot)
    setSlotDialogOpen(true)
  }

  // Get status color and label for the unified status pane
  const getStatusConfig = () => {
    if (deviceMode === 'fastbootd') {
      return {
        label: 'Fastbootd',
        dotClass: 'bg-[var(--success)] shadow-[var(--glow-success)]',
        bgClass: 'bg-[var(--success)]/10 dark:bg-[var(--success)]/20 border-[var(--success)]/30 dark:border-[var(--success)]/20 text-[var(--success)]',
      }
    }
    if (deviceMode === 'fastboot') {
      return {
        label: 'Fastboot',
        dotClass: 'bg-[var(--primary)] shadow-[var(--glow-info)]',
        bgClass: 'bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20 border-[var(--primary)]/30 dark:border-[var(--primary)]/20 text-[var(--primary)]',
      }
    }
    if (deviceMode === 'sideload') {
      return {
        label: 'Sideload',
        dotClass: 'bg-[var(--warning)] shadow-[var(--glow-warning)]',
        bgClass: 'bg-[var(--warning)]/10 dark:bg-[var(--warning)]/20 border-[var(--warning)]/30 dark:border-[var(--warning)]/20 text-[var(--warning)]',
      }
    }
    return {
      label: 'Disconnected',
      dotClass: 'bg-muted-foreground dark:bg-muted-foreground',
      bgClass: 'bg-[var(--muted)]/30 dark:bg-[var(--muted)]/30 border-[var(--border)] dark:border-[var(--border)] text-muted-foreground dark:text-muted-foreground',
    }
  }

  const status = getStatusConfig()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">ROM Flasher</h2>
        <p className="text-xs text-muted-foreground">
          {isSideload
            ? 'Device is in sideload mode. Sideload a ZIP package to install.'
            : 'Flash partitions, ROM folders, A/B slot management, and wipe operations.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Unified Device Status Pane */}
        <div className={cn(
          "flex items-center gap-2.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-300",
          status.bgClass
        )}>
          <span className={cn("h-2 w-2 rounded-full animate-pulse", status.dotClass)} />
          <div className="flex items-center gap-1.5 font-mono">
            {hasDevice && activeFastbootSerial && (
              <span className="opacity-90 max-w-[80px] truncate" title={activeFastbootSerial}>
                {activeFastbootSerial}
              </span>
            )}
            {hasDevice && <span className="opacity-40">|</span>}
            <span>{status.label}</span>
          </div>
        </div>

        {/* macOS-style Slot Switcher */}
        {hasSlot && (
          <div className="flex items-center gap-0.5 rounded-full border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)] dark:bg-[var(--muted)] p-0.5 shadow-sm">
            <button
              onClick={() => currentSlot === 'b' && handleSlotSwitch('a')}
              disabled={runningSlotChange}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 cursor-pointer",
                currentSlot === 'a'
                  ? "bg-card dark:bg-card text-foreground dark:text-foreground shadow-sm"
                  : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
              )}
            >
              Slot A
            </button>
            <button
              onClick={() => currentSlot === 'a' && handleSlotSwitch('b')}
              disabled={runningSlotChange}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 cursor-pointer",
                currentSlot === 'b'
                  ? "bg-card dark:bg-card text-foreground dark:text-foreground shadow-sm"
                  : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
              )}
            >
              Slot B
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground dark:text-muted-foreground hover:bg-[var(--muted)] dark:hover:bg-[var(--muted)]"
            onClick={() => syncFastbootDevices(true)}
            disabled={refreshingDevices}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshingDevices && "animate-spin")} />
          </Button>

          {lastUpdatedAt && (
            <span className="text-[10px] text-muted-foreground font-medium ml-1">
              Refreshed {timeAgo(lastUpdatedAt)}
            </span>
          )}
        </div>
      </div>

      <AlertDialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Active Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Switch from slot {currentSlot.toUpperCase()} to slot {pendingSlot.toUpperCase()}?
              The device will boot from slot {pendingSlot.toUpperCase()} on next restart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => applyActiveSlot(pendingSlot)}
              className="rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0 shadow-sm"
            >
              Switch to Slot {pendingSlot.toUpperCase()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
