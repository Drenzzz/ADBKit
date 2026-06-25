import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useDevices } from '@/hooks/useDevices'
import { rebootDevice } from '@/services/deviceService'
import { HeroDeviceCard } from '@/components/dashboard/HeroDeviceCard'
import { HeroEmptyState } from '@/components/dashboard/HeroEmptyState'
import { LiveMonitorCard } from '@/components/dashboard/LiveMonitorCard'
import { WirelessConnectCard } from '@/components/dashboard/WirelessConnectCard'
import { DeviceInfoCard } from '@/components/dashboard/DeviceInfoCard'
import { toast } from 'sonner'

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

type TaglineContext = 'online' | 'unauthorized' | 'offline' | 'empty'

const TAGLINES: Record<TaglineContext, string> = {
  online: 'All systems nominal. Your workspace is connected and ready.',
  unauthorized: 'USB authorization pending. Check your device screen to allow debugging.',
  offline: 'Device is offline. Verify the USB connection or restart USB debugging.',
  empty: 'Workspace is idle. Plug in a device or link via wireless ADB below.',
}

export default function DashboardPage() {
  const reduced = useReducedMotion()
  const {
    devices,
    activeSerial,
    deviceInfo,
    nicknames,
    refreshing,
    refreshDevices,
  } = useDevices()

  const isOnline = deviceInfo?.state === 'device'
  const hasDevices = devices.length > 0

  const taglineContext = useMemo((): TaglineContext => {
    if (!hasDevices) return 'empty'
    if (deviceInfo?.state === 'unauthorized') return 'unauthorized'
    if (deviceInfo?.state === 'offline' || !isOnline) return 'offline'
    return 'online'
  }, [hasDevices, deviceInfo?.state, isOnline])

  const tagline = TAGLINES[taglineContext]

  const handleReboot = async (mode: string) => {
    if (!activeSerial) return
    try {
      const message = await rebootDevice(activeSerial, mode)
      toast.success(`Reboot command sent`, { description: `Mode: ${mode}. ${message}` })
      setTimeout(() => refreshDevices(), 3000)
    } catch (e) {
      toast.error('Reboot command failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduced
        ? { duration: 0, staggerChildren: 0 }
        : { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 350, damping: 26 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 font-sans"
    >
      {/* Header Greeting */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {getTimeGreeting()}
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          {tagline}
        </p>
      </motion.div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <motion.div variants={itemVariants}>
            {activeSerial && deviceInfo ? (
              <HeroDeviceCard
                deviceInfo={deviceInfo}
                nickname={nicknames[activeSerial]}
                refreshing={refreshing}
                onRefresh={refreshDevices}
                onReboot={handleReboot}
              />
            ) : (
              <HeroEmptyState
                refreshing={refreshing}
                onRefresh={refreshDevices}
              />
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <WirelessConnectCard />
          </motion.div>
        </div>

        {/* Right 1 Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <motion.div variants={itemVariants}>
          <LiveMonitorCard />
        </motion.div>

          {activeSerial && deviceInfo && (
            <motion.div variants={itemVariants}>
              <DeviceInfoCard />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
