import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PartitionChips } from '@/components/flasher/shared/PartitionChips'
import { FilePicker } from '@/components/flasher/shared/FilePicker'
import { useFlasher } from '@/hooks/useFlasher'
import { AlertTriangle, Zap } from 'lucide-react'

const LOGICAL_PARTITIONS = ['system', 'system_ext', 'vendor', 'product', 'odm', 'super', 'userdata']

export function PartitionFlashCard() {
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
  const canFlash = !!activeFastbootSerial && !!selectedPartition && !!selectedImagePath && !needsUserspace

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4" />
          Flash Partition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PartitionChips
          selected={selectedPartition}
          onSelect={setSelectedPartition}
          disabled={runningFlash}
        />

        <Input
          placeholder="Or type partition name..."
          value={selectedPartition}
          onChange={(e) => setSelectedPartition(e.target.value)}
          disabled={runningFlash}
          className="h-8 text-xs"
        />

        <Separator />

        <FilePicker
          value={selectedImagePath}
          placeholder="Select .img or .bin file..."
          variant="file-image"
          onBrowse={chooseImageFile}
          disabled={runningFlash}
        />

        {needsUserspace && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Logical partitions need fastbootd. Run{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                fastboot reboot fastboot
              </code>{' '}
              first.
            </AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full"
          onClick={executeFlashPartition}
          disabled={!canFlash || runningFlash}
        >
          {runningFlash ? 'Flashing...' : 'Flash Partition'}
        </Button>
      </CardContent>
    </Card>
  )
}
