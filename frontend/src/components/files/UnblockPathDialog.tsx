import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Button } from '@astryxdesign/core/Button'
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

  const isVolumeMissing = result.type === 2

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} width={448} padding={6}>
      <div className="grid gap-6">
        <DialogHeader
          onOpenChange={onOpenChange}
          title={
            <span className="font-heading text-base leading-none font-medium">
              {isVolumeMissing ? 'Storage Not Available' : 'Path Not Accessible'}
            </span>
          }
          subtitle={
            <span className="block space-y-2 text-sm text-muted-foreground">
              <span className="block font-mono text-[13px] bg-muted px-2 py-1.5 rounded border">
                {result.path}
              </span>
              {result.reason && (
                <span className="block text-[14px] text-foreground">{result.reason}</span>
              )}
              <span className="block text-[14px]">
                {isVolumeMissing
                  ? 'The removable storage is currently disconnected. Reconnect it and try again.'
                  : 'This path is protected by Android and cannot be accessed through File Explorer.'}
              </span>
            </span>
          }
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
          {isVolumeMissing && (
            <Button variant="primary" size="sm" onClick={onRetry} label="Retry" />
          )}
          {!isVolumeMissing && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onOpenChange(false)
              }}
              icon={<IconSettings className="h-3.5 w-3.5" />}
              label="Open Device Settings"
            />
          )}
        </div>
      </div>
    </Dialog>
  )
}
