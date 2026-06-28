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
    <Card className="relative overflow-hidden border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/40 rounded-2xl shadow-[var(--shadow-card)] h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Zap className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
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
              className="h-8 rounded-full border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/60 focus-visible:ring-1 focus-visible:ring-muted-foreground dark:focus-visible:ring-muted-foreground text-xs pl-3.5"
            />
          </div>

          <div className="h-px bg-[var(--muted)] dark:bg-[var(--muted)]/80" />

          <FilePicker
            value={selectedImagePath}
            placeholder="Select .img or .bin file..."
            variant="file-image"
            onBrowse={chooseImageFile}
            disabled={disabled || runningFlash}
          />

          {needsUserspace && (
            <Alert variant="destructive" className="rounded-xl py-2 px-3 border-[var(--destructive)]/20 dark:border-[var(--destructive)]/10 bg-[var(--destructive)]/10 dark:bg-[var(--destructive)]/20 text-[var(--destructive)]">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--destructive)]" />
              <AlertDescription className="text-[11px] leading-relaxed">
                Logical partitions need fastbootd. Run{' '}
                <code className="rounded bg-[var(--destructive)]/10 dark:bg-[var(--destructive)]/60 px-1 py-0.5 font-mono text-[10px] text-[var(--destructive)] dark:text-[var(--destructive)]">
                  fastboot reboot fastboot
                </code>{' '}
                first.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0 transition-[colors,transform] active:scale-[0.97] cursor-pointer text-xs font-semibold shadow-sm h-9 mt-4"
          onClick={executeFlashPartition}
          disabled={!canFlash || runningFlash}
        >
          {runningFlash ? 'Flashing...' : 'Flash Partition'}
        </Button>
      </CardContent>

      {disabled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/80 dark:bg-[var(--terminal-surface)]/85 backdrop-blur-[3px] select-none transition-colors duration-300">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/90 px-3 py-1.5 shadow-sm text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
            Fastboot Mode Required
          </div>
        </div>
      )}
    </Card>
  )
}
