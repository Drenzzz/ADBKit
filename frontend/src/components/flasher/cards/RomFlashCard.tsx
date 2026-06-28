import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { FilePicker } from '@/components/flasher/shared/FilePicker'
import { RomPartitionList } from '@/components/flasher/shared/RomPartitionList'
import { useFlasher } from '@/hooks/useFlasher'
import { FolderSearch, Loader2, Cpu } from 'lucide-react'

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
  const completedCount = flashPlanSteps.filter((s) => s.status === 'success').length
  const progress = hasPlan ? (completedCount / flashPlanSteps.length) * 100 : 0

  function handleConfirmFlash() {
    setConfirmOpen(false)
    executeBatchFlash()
  }

  return (
    <Card className="relative overflow-hidden border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/40 rounded-2xl shadow-[var(--shadow-card)] h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FolderSearch className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
          Flash ROM Folder
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4 flex-1">
          <FilePicker
            value={romFolderPath}
            placeholder="Select ROM folder..."
            variant="folder"
            onBrowse={chooseRomFolder}
            disabled={disabled || runningBatchFlash}
          />

          <Button
            variant="outline"
            className="w-full rounded-full border border-[var(--border)] dark:border-[var(--border)] bg-card hover:bg-[var(--muted)]/50 dark:bg-[var(--muted)] dark:hover:bg-[var(--muted)]/80 text-xs font-semibold cursor-pointer h-9 transition-colors"
            onClick={scanSelectedRomFolder}
            disabled={disabled || !romFolderPath || scanningPlan || runningBatchFlash}
          >
            {scanningPlan ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Scanning ROM folder...
              </>
            ) : (
              'Scan ROM Folder'
            )}
          </Button>

          {hasPlan && (
            <>
              <div className="h-px bg-[var(--muted)] dark:bg-[var(--muted)]/80" />
              <RomPartitionList
                steps={flashPlanSteps}
                selectedPartitions={selectedPartitions}
                onToggle={togglePartitionSelection}
                onSelectAll={selectAllPartitions}
                onDeselectAll={deselectAllPartitions}
                disabled={disabled || runningBatchFlash}
              />
            </>
          )}

          {runningBatchFlash && hasPlan && (
            <div className="space-y-2 rounded-xl bg-[var(--muted)]/30 dark:bg-[var(--muted)]/30 p-3 border border-[var(--muted)] dark:border-[var(--muted)]/50">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">
                <span>Flashing progress</span>
                <span>{completedCount}/{flashPlanSteps.length} completed</span>
              </div>
              <Progress value={progress} className="h-1.5 rounded-full" />
            </div>
          )}
        </div>

        {hasPlan && (
          <Button
            className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0 transition-[colors,transform] active:scale-[0.97] cursor-pointer text-xs font-semibold shadow-sm h-9 mt-4"
            onClick={() => setConfirmOpen(true)}
            disabled={!hasDevice || selectedCount === 0 || runningBatchFlash}
          >
            {runningBatchFlash
              ? 'Flashing ROM...'
              : `Flash ${selectedCount} Partition(s)`}
          </Button>
        )}
      </CardContent>

      {disabled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/80 dark:bg-[var(--terminal-surface)]/85 backdrop-blur-[3px] select-none transition-colors duration-300">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/90 px-3 py-1.5 shadow-sm text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
            Fastboot Mode Required
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Batch Flash</AlertDialogTitle>
            <AlertDialogDescription>
              This will flash {selectedCount} partition(s) to the connected device. Make sure you
              selected the correct ROM folder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmFlash}
              className="rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0 shadow-sm"
            >
              Flash {selectedCount} Partition(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
