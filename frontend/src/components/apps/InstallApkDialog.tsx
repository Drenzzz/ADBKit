import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface InstallApkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  installing: boolean
  onInstall: () => void
}

export function InstallApkDialog({
  open,
  onOpenChange,
  installing,
  onInstall,
}: InstallApkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install APK</DialogTitle>
          <DialogDescription>
            Select an APK file from your computer to install on the connected device.
            Existing installations with the same package name will be replaced.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={installing}>
            Cancel
          </Button>
          <Button onClick={onInstall} disabled={installing}>
            {installing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select APK
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
