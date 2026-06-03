import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className={disabled ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          Sideload
          {disabled && (
            <Badge variant="outline" className="ml-auto text-[10px] text-muted-foreground">
              Requires sideload
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isSideloadMode ? 'bg-green-500' : disabled ? 'bg-muted' : 'bg-yellow-500'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isSideloadMode
              ? 'Ready'
              : disabled
                ? 'Device must be in sideload mode'
                : 'No device in sideload mode'}
          </span>
        </div>

        <FilePicker
          value={sideloadFilePath}
          placeholder="Select .zip file for sideload..."
          variant="file"
          onBrowse={chooseSideloadFile}
          disabled={disabled || runningSideload}
        />

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
