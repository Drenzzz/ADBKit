import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return ''
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}

function getModeBadge(mode: import('@/lib/types').FlasherMode | null) {
  if (mode === 'fastbootd') return { label: 'Fastbootd', variant: 'default' as const }
  if (mode === 'fastboot') return { label: 'Fastboot', variant: 'secondary' as const }
  if (mode === 'sideload') return { label: 'Sideload', variant: 'destructive' as const }
  return null
}

export function FlasherHeader() {
  const {
    fastbootDevices,
    activeFastbootSerial,
    deviceMode,
    currentSlot,
    loadingDevices,
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
  const modeBadge = getModeBadge(deviceMode)
  const isSideload = deviceMode === 'sideload'

  function handleSlotSwitch(slot: string) {
    setPendingSlot(slot)
    setSlotDialogOpen(true)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">ROM Flasher</h2>
        <p className="text-sm text-muted-foreground">
          {isSideload
            ? 'Device is in sideload mode. Sideload a ZIP package to install.'
            : 'Flash partitions, ROM folders, A/B slot management, and wipe operations.'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {hasDevice && (
          <>
            {hasDevice && activeFastbootSerial && (
              <span
                className="max-w-[80px] truncate text-sm font-mono text-muted-foreground"
                title={activeFastbootSerial}
              >
                {activeFastbootSerial}
              </span>
            )}

            {modeBadge && (
              <Badge variant={modeBadge.variant} className="text-xs">
                {modeBadge.label}
              </Badge>
            )}

            {hasSlot && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  handleSlotSwitch(currentSlot === 'a' ? 'b' : 'a')
                }
                disabled={runningSlotChange}
              >
                Slot {currentSlot.toUpperCase()}
              </Button>
            )}
          </>
        )}

        {!hasDevice && !loadingDevices && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            No device connected
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => syncFastbootDevices(true)}
          disabled={refreshingDevices}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshingDevices ? 'animate-spin' : ''}`} />
        </Button>

        {lastUpdatedAt && (
          <span className="text-xs text-muted-foreground">{timeAgo(lastUpdatedAt)}</span>
        )}
      </div>

      <AlertDialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Active Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Switch from slot {currentSlot.toUpperCase()} to slot {pendingSlot.toUpperCase()}?
              The device will boot from slot {pendingSlot.toUpperCase()} on next restart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => applyActiveSlot(pendingSlot)}>
              Switch to Slot {pendingSlot.toUpperCase()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
