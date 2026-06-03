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
import { useFlasher } from '@/hooks/useFlasher'
import { Trash2, Loader2 } from 'lucide-react'

interface WipeDataCardProps {
  disabled?: boolean
}

export function WipeDataCard({ disabled }: WipeDataCardProps) {
  const { activeFastbootSerial, runningWipe, executeWipeData } = useFlasher()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const hasDevice = !!activeFastbootSerial && !disabled

  return (
    <Card className={disabled ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Trash2 className="h-4 w-4" />
          Wipe Data
          {disabled && (
            <Badge variant="outline" className="ml-auto text-[10px] text-muted-foreground">
              Requires fastboot
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Erase all user data, apps, and accounts. This action is permanent and cannot be undone.
        </p>

        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setConfirmOpen(true)}
          disabled={!hasDevice || runningWipe}
        >
          {runningWipe ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wiping...
            </>
          ) : (
            'Wipe Everything'
          )}
        </Button>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Factory Reset</AlertDialogTitle>
            <AlertDialogDescription>
              All user data, downloaded files, accounts, and encryption keys will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => { setConfirmOpen(false); executeWipeData() }}
            >
              Wipe Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
