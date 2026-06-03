import { FlasherHeader } from '@/components/flasher/FlasherHeader'
import { PartitionFlashCard } from '@/components/flasher/cards/PartitionFlashCard'
import { RomFlashCard } from '@/components/flasher/cards/RomFlashCard'
import { SideloadCard } from '@/components/flasher/cards/SideloadCard'
import { WipeDataCard } from '@/components/flasher/cards/WipeDataCard'
import { Separator } from '@/components/ui/separator'
import { useFlasher } from '@/hooks/useFlasher'

export function FlasherBento() {
  const { deviceMode } = useFlasher()

  const isFastboot = deviceMode === 'fastboot' || deviceMode === 'fastbootd'
  const isSideload = deviceMode === 'sideload'
  const hasDevice = isFastboot || isSideload

  const flashDisabled = !hasDevice || isSideload
  const sideloadDisabled = !hasDevice || isFastboot

  return (
    <div className="space-y-6">
      <FlasherHeader />
      <Separator />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PartitionFlashCard disabled={flashDisabled} />
        <RomFlashCard disabled={flashDisabled} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SideloadCard disabled={sideloadDisabled} />
        <WipeDataCard disabled={flashDisabled} />
      </div>
    </div>
  )
}
