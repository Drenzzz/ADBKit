import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PartitionChips } from '@/components/flasher/shared/PartitionChips'
import { FilePicker } from '@/components/flasher/shared/FilePicker'
import { useFlasher } from '@/hooks/useFlasher'
import { AlertTriangle, Zap, Cpu } from 'lucide-react'

const LOGICAL_PARTITIONS = ['system', 'system_ext', 'vendor', 'product', 'odm', 'super', 'userdata']

interface PartitionFlashCardProps {
  disabled?: boolean
}

export function PartitionFlashCard({ disabled }: PartitionFlashCardProps) {
  const {
    activeFastbootSerial,
    selectedPartition,
    setSelectedPartition,
    selectedImagePath,
    isUserspace,
    runningFlash,
    chooseImageFile,
    executeFlashPartition,
  } = useFlasher()

  const needsUserspace =
    LOGICAL_PARTITIONS.includes(selectedPartition) && !isUserspace && !!activeFastbootSerial
  const canFlash =
    !!activeFastbootSerial && !!selectedPartition && !!selectedImagePath && !needsUserspace && !disabled

  return (
    <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0b10]/40 rounded-2xl shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Zap className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          Flash Partition
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4 flex-1">
          <PartitionChips
            selected={selectedPartition}
            onSelect={setSelectedPartition}
            disabled={disabled || runningFlash}
          />

          <div className="relative flex items-center">
            <Input
              placeholder="Or type partition name..."
              value={selectedPartition}
              onChange={(e) => setSelectedPartition(e.target.value)}
              disabled={disabled || runningFlash}
              className="h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 text-xs pl-3.5"
            />
          </div>

          <div className="h-px bg-zinc-150 dark:bg-zinc-800/80" />

          <FilePicker
            value={selectedImagePath}
            placeholder="Select .img or .bin file..."
            variant="file-image"
            onBrowse={chooseImageFile}
            disabled={disabled || runningFlash}
          />

          {needsUserspace && (
            <Alert variant="destructive" className="rounded-xl py-2 px-3 border-rose-500/20 dark:border-rose-500/10 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              <AlertDescription className="text-[11px] leading-relaxed">
                Logical partitions need fastbootd. Run{' '}
                <code className="rounded bg-rose-100 dark:bg-rose-950/60 px-1 py-0.5 font-mono text-[10px] text-rose-700 dark:text-rose-300">
                  fastboot reboot fastboot
                </code>{' '}
                first.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0 transition-all active:scale-[0.97] cursor-pointer text-xs font-semibold shadow-sm h-9 mt-4"
          onClick={executeFlashPartition}
          disabled={!canFlash || runningFlash}
        >
          {runningFlash ? 'Flashing...' : 'Flash Partition'}
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
    </Card>
  )
}
