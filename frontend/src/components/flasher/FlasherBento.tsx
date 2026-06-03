import { FlasherHeader } from '@/components/flasher/FlasherHeader'
import { PartitionFlashCard } from '@/components/flasher/cards/PartitionFlashCard'
import { RomFlashCard } from '@/components/flasher/cards/RomFlashCard'
import { SideloadCard } from '@/components/flasher/cards/SideloadCard'
import { WipeDataCard } from '@/components/flasher/cards/WipeDataCard'
import { Separator } from '@/components/ui/separator'
import { useFlasher } from '@/hooks/useFlasher'
import { Badge } from '@/components/ui/badge'

export function FlasherBento() {
  const { deviceMode } = useFlasher()

  const isSideload = deviceMode === 'sideload'
  const isFastboot = deviceMode === 'fastboot' || deviceMode === 'fastbootd'

  return (
    <div className="space-y-6">
      <FlasherHeader />
      <Separator />

      {isSideload && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SideloadCard />
        </div>
      )}

      {isFastboot && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PartitionFlashCard />
            <RomFlashCard />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WipeDataCard />
          </div>
        </>
      )}

      {!deviceMode && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Badge variant="outline" className="mb-3 text-sm text-muted-foreground">
            No device detected
          </Badge>
          <p className="text-sm text-muted-foreground">
            Connect a device in fastboot or sideload mode to use the flasher.
          </p>
        </div>
      )}
    </div>
  )
}
