import { motion } from 'motion/react'
import { FlasherHeader } from '@/components/flasher/FlasherHeader'
import { PartitionFlashCard } from '@/components/flasher/cards/PartitionFlashCard'
import { RomFlashCard } from '@/components/flasher/cards/RomFlashCard'
import { SideloadCard } from '@/components/flasher/cards/SideloadCard'
import { WipeDataCard } from '@/components/flasher/cards/WipeDataCard'
import { WakeOnFastbootCard } from '@/components/flasher/cards/WakeOnFastbootCard'
import { Separator } from '@/components/ui/separator'
import { useFlasher } from '@/hooks/useFlasher'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { NoDeviceEmptyState } from '@/components/common/NoDeviceEmptyState'

export function FlasherBento() {
  const { deviceMode } = useFlasher()
  const reduced = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduced
        ? { duration: 0, staggerChildren: 0 }
        : { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  }

  const isFastboot = deviceMode === 'fastboot' || deviceMode === 'fastbootd'
  const isSideload = deviceMode === 'sideload'
  const hasDevice = isFastboot || isSideload

  if (!hasDevice) {
    return (
      <div className="space-y-6">
        <FlasherHeader />
        <NoDeviceEmptyState feature="flashing and Fastboot operations" />
      </div>
    )
  }

  const flashDisabled = isSideload
  const sideloadDisabled = isFastboot

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <FlasherHeader />
      </motion.div>
      <motion.div variants={itemVariants}>
        <Separator className="bg-[var(--muted)] dark:bg-[var(--muted)]" />
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PartitionFlashCard disabled={flashDisabled} />
        <RomFlashCard disabled={flashDisabled} />
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SideloadCard disabled={sideloadDisabled} />
        <WipeDataCard disabled={flashDisabled} />
      </motion.div>
      <motion.div variants={itemVariants}>
        <WakeOnFastbootCard />
      </motion.div>
    </motion.div>
  )
}
