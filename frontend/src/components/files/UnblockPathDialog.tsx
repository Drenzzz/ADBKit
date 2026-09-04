import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IconSettings } from '@tabler/icons-react'
import type { UnblockResult } from '@/lib/types'

interface UnblockPathDialogProps {
  result: UnblockResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetry: () => void
}

export function UnblockPathDialog({
  result,
  open,
  onOpenChange,
  onRetry,
}: UnblockPathDialogProps) {
  if (!result) return null

  const isVolumeMissing = result.type === 'protected'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isVolumeMissing ? 'Storage Not Available' : 'Path Not Accessible'}
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p className="font-mono text-xs bg-muted px-2 py-1.5 rounded border">
              {result.path}
            </p>
            {result.reason && (
              <p className="text-sm text-foreground">{result.reason}</p>
            )}
            <p className="text-sm">
              {isVolumeMissing
                ? 'The removable storage is currently disconnected. Reconnect it and try again.'
                : 'This path is protected by Android and cannot be accessed through File Explorer.'}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {isVolumeMissing && (
            <Button size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
          {!isVolumeMissing && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              <IconSettings className="h-3.5 w-3.5 mr-1.5" />
              Open Device Settings
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
