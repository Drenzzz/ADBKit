import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { useFlasher } from '@/hooks/useFlasher'
import { Package, Loader2 } from 'lucide-react'

export function SideloadCard() {
  const {
    deviceMode,
    activeFastbootSerial,
    sideloadFilePath,
    runningSideload,
    chooseSideloadFile,
    executeSideload,
  } = useFlasher()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const isSideloadMode = deviceMode === 'sideload'
  const hasDevice = !!activeFastbootSerial
  const hasFile = !!sideloadFilePath

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          Sideload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isSideloadMode ? 'bg-green-500' : 'bg-muted'}`} />
          <span className="text-xs text-muted-foreground">
            {isSideloadMode ? 'Ready' : 'Device not in sideload mode'}
          </span>
        </div>

        <FilePicker
          value={sideloadFilePath}
          placeholder="Select .zip file for sideload..."
          variant="file"
          onBrowse={chooseSideloadFile}
          disabled={runningSideload}
        />

        <Button
          className="w-full"
          onClick={() => setConfirmOpen(true)}
          disabled={!hasDevice || !hasFile || runningSideload || !isSideloadMode}
        >
          {runningSideload ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sideloading...
            </>
          ) : (
            'Sideload Package'
          )}
        </Button>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sideload</AlertDialogTitle>
            <AlertDialogDescription>
              This will push the selected ZIP to the device via recovery sideload. The device must
              be in sideload/recovery mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmOpen(false); executeSideload() }}>
              Start Sideload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
