import { FlasherHeader } from '@/components/flasher/FlasherHeader'
import { PartitionFlashCard } from '@/components/flasher/cards/PartitionFlashCard'
import { RomFlashCard } from '@/components/flasher/cards/RomFlashCard'
import { SideloadCard } from '@/components/flasher/cards/SideloadCard'
import { WipeDataCard } from '@/components/flasher/cards/WipeDataCard'
import { TerminalCard } from '@/components/flasher/cards/TerminalCard'
import { Separator } from '@/components/ui/separator'

export function FlasherBento() {
  return (
    <div className="space-y-6">
      <FlasherHeader />
      <Separator />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PartitionFlashCard />
        <RomFlashCard />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SideloadCard />
        <WipeDataCard />
        <TerminalCard />
      </div>
    </div>
  )
}
