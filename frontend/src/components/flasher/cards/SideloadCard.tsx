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
import {
  IconBox as Package,
  IconLoader2 as Loader2,
  IconCpu as Cpu
} from "@tabler/icons-react"
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
    <Card className="relative overflow-hidden border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/40 rounded-2xl shadow-[var(--shadow-card)] h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
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
                  ? "bg-[var(--success)] shadow-[var(--glow-success)] animate-pulse" 
                  : "bg-muted-foreground dark:bg-muted-foreground"
              )}
            />
            <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">
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
            <div className="space-y-2 rounded-xl bg-[var(--muted)]/30 dark:bg-[var(--muted)]/30 p-3 border border-[var(--muted)] dark:border-[var(--muted)]/50">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">
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
          className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0 transition-[colors,transform] active:scale-[0.97] cursor-pointer text-xs font-semibold shadow-sm h-9 mt-4"
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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/80 dark:bg-[var(--terminal-surface)]/85 backdrop-blur-[3px] select-none transition-colors duration-300">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/90 px-3 py-1.5 shadow-sm text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
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
