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
import { Package, Loader2, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0b10]/40 rounded-2xl shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          Sideload Package
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 px-1.5">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isSideloadMode 
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" 
                  : "bg-zinc-300 dark:bg-zinc-700"
              )}
            />
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-500">
              {isSideloadMode ? 'Sideload mode ready' : 'No device in sideload mode'}
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
            <div className="space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-100 dark:border-zinc-900/50">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Sideloading in progress...
                </span>
              </div>
              <Progress value={null} className="h-1.5 animate-pulse" />
            </div>
          )}
        </div>

        <Button
          className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0 transition-all active:scale-[0.97] cursor-pointer text-xs font-semibold shadow-sm h-9 mt-4"
          onClick={() => setConfirmOpen(true)}
          disabled={disabled || !hasDevice || !hasFile || runningSideload}
        >
          {runningSideload ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Sideloading...
            </>
          ) : (
            'Sideload Package'
          )}
        </Button>
      </CardContent>

      {disabled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-[#08090d]/85 backdrop-blur-[3px] select-none transition-all duration-300">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 py-1.5 shadow-sm text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            <Cpu className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
            Sideload Mode Required
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sideload</AlertDialogTitle>
            <AlertDialogDescription>
              This will push the selected ZIP to the device via recovery sideload. The device must
              be in sideload/recovery mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { setConfirmOpen(false); executeSideload() }}
              className="rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0 shadow-sm"
            >
              Start Sideload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
