import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { FolderSearch, Loader2 } from 'lucide-react'

export function RomFlashCard() {
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
  const hasDevice = !!activeFastbootSerial
  const hasPlan = flashPlan && flashPlanSteps.length > 0
  const selectedCount = selectedPartitions.length
  const completedCount = flashPlanSteps.filter((s) => s.status === 'success').length
  const progress = hasPlan ? (completedCount / flashPlanSteps.length) * 100 : 0

  function handleConfirmFlash() {
    setConfirmOpen(false)
    executeBatchFlash()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FolderSearch className="h-4 w-4" />
          Flash ROM Folder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilePicker
          value={romFolderPath}
          placeholder="Select ROM folder..."
          variant="folder"
          onBrowse={chooseRomFolder}
          disabled={runningBatchFlash}
        />

        <Button
          variant="outline"
          className="w-full"
          onClick={scanSelectedRomFolder}
          disabled={!romFolderPath || scanningPlan || runningBatchFlash}
        >
          {scanningPlan ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            'Scan Folder'
          )}
        </Button>

        {hasPlan && (
          <>
            <Separator />
            <RomPartitionList
              steps={flashPlanSteps}
              selectedPartitions={selectedPartitions}
              onToggle={togglePartitionSelection}
              onSelectAll={selectAllPartitions}
              onDeselectAll={deselectAllPartitions}
              disabled={runningBatchFlash}
            />
          </>
        )}

        {runningBatchFlash && hasPlan && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-xs text-muted-foreground">
              Flashing {completedCount}/{flashPlanSteps.length}...
            </p>
          </div>
        )}

        {hasPlan && (
          <Button
            className="w-full"
            onClick={() => setConfirmOpen(true)}
            disabled={!hasDevice || selectedCount === 0 || runningBatchFlash}
          >
            {runningBatchFlash
              ? 'Flashing...'
              : `Flash ${selectedCount} Partition(s)`}
          </Button>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Batch Flash</AlertDialogTitle>
            <AlertDialogDescription>
              This will flash {selectedCount} partition(s) to the connected device. Make sure you
              selected the correct ROM folder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFlash}>
              Flash {selectedCount} Partition(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
