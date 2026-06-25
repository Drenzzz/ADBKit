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
import { useFlasher } from '@/hooks/useFlasher'
import { Trash2, Loader2, Cpu } from 'lucide-react'

interface WipeDataCardProps {
  disabled?: boolean
}

export function WipeDataCard({ disabled }: WipeDataCardProps) {
  const { activeFastbootSerial, runningWipe, executeWipeData } = useFlasher()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const hasDevice = !!activeFastbootSerial && !disabled

  return (
    <Card className="relative overflow-hidden border-rose-200/60 dark:border-rose-950/40 bg-rose-50/[0.08] dark:bg-rose-950/[0.04] rounded-2xl shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
          <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          Danger Zone: Wipe Data
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4 flex-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
            Erase all user data, installed apps, and accounts. This action is permanent and cannot be undone.
          </p>
        </div>

        <Button
          variant="destructive"
          className="w-full rounded-full bg-rose-600 hover:bg-rose-500 text-white border-0 transition-all active:scale-[0.97] cursor-pointer text-xs font-semibold shadow-sm h-9 mt-4"
          onClick={() => setConfirmOpen(true)}
          disabled={!hasDevice || runningWipe}
        >
          {runningWipe ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Wiping device...
            </>
          ) : (
            'Wipe Everything (Factory Reset)'
          )}
        </Button>
      </CardContent>

      {disabled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-[#08090d]/85 backdrop-blur-[3px] select-none transition-all duration-300">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 py-1.5 shadow-sm text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            <Cpu className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
            Fastboot Mode Required
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Factory Reset Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              All user files, downloaded apps, system accounts, and encryption keys on the device will be permanently deleted. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setConfirmOpen(false); executeWipeData() }}
              className="rounded-full bg-rose-600 hover:bg-rose-500 text-white border-0 shadow-sm"
            >
              Wipe Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
