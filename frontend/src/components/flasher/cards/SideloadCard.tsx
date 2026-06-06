import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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

interface SideloadCardProps {
  disabled?: boolean
}

export function SideloadCard({ disabled }: SideloadCardProps) {
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
    <Card className={`relative overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      {disabled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
          <p className="text-center text-xs text-muted-foreground">
            Device must be in<br />sideload mode
          </p>
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          Sideload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isSideloadMode ? 'bg-green-500' : 'bg-muted'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isSideloadMode ? 'Ready' : 'No device in sideload mode'}
          </span>
        </div>

        <FilePicker
          value={sideloadFilePath}
          placeholder="Select .zip file for sideload..."
          variant="file"
          onBrowse={chooseSideloadFile}
          disabled={disabled || runningSideload}
        />

        {runningSideload && (
          <div className="space-y-2">
            <Progress value={null} className="h-2 animate-pulse" />
            <p className="text-center text-xs text-muted-foreground">
              Sideload in progress... Do not disconnect the device.
            </p>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => setConfirmOpen(true)}
          disabled={disabled || !hasDevice || !hasFile || runningSideload}
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
