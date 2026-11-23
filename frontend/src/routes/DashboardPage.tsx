import { motion, useReducedMotion } from 'motion/react'
import { IconRefresh } from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { useDevices } from '@/hooks/useDevices'
import { rebootDevice } from '@/services/deviceService'
import { DeviceStage } from '@/components/dashboard/DeviceStage'
import { NoDeviceState } from '@/components/apps/EmptyStates'
import { LiveTelemetry } from '@/components/dashboard/LiveTelemetry'
import { ConnectionPanel } from '@/components/dashboard/ConnectionPanel'
import { DeviceSpecs } from '@/components/dashboard/DeviceSpecs'
import { toast } from '@/lib/toast'

export default function DashboardPage() {
  const {
    devices,
    activeSerial,
    deviceInfo,
    nicknames,
    refreshing,
    refreshDevices,
  } = useDevices()

  const isOnline = deviceInfo?.state === 'device'

  const handleReboot = async (mode: string) => {
    if (!activeSerial) return
    try {
      const message = await rebootDevice(activeSerial, mode)
      toast.success('Reboot command sent', { description: `Mode: ${mode}. ${message}` })
      setTimeout(() => refreshDevices(), 3000)
    } catch (e) {
      toast.error('Reboot command failed', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const reduced = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduced ? 0 : 0.08, delayChildren: reduced ? 0 : 0.04 },
    },
  }
  const item = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.18 : 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  }

  if (!activeSerial || !deviceInfo) {
    return (
      <motion.div
        className="dashboard-scale js flex h-full min-h-0 flex-col gap-4 p-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Heading level={1} type="display-1" weight="semibold" maxLines={1}>
            Dashboard
          </Heading>
        </motion.div>
        <motion.div variants={item} className="min-h-0 flex-1">
          <NoDeviceState
            onRefresh={refreshDevices}
            refreshing={refreshing}
            description="Connect an Android device over USB with debugging enabled, or use the wireless panel below"
          />
        </motion.div>
        <motion.div variants={item}>
          <ConnectionPanel />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="dashboard-scale js flex h-full flex-col gap-4 p-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
      <HStack gap={3} vAlign="center" wrap="wrap" className="dashboard-header">
        <div className="min-w-0 flex-1">
          <Heading level={1} type="display-2" weight="semibold" maxLines={1}>
            Dashboard
          </Heading>
        </div>
        {devices.length > 0 && (
          isOnline
            ? <Badge variant="success" label="Connected" className="px-3 py-2 !text-[16px]" />
            : deviceInfo?.state === 'unauthorized'
              ? <Badge variant="warning" label="Authorize" className="px-3 py-2 !text-[16px]" />
              : <Badge variant="error" label="Offline" className="px-3 py-2 !text-[16px]" />
        )}
        <Button
          label="Refresh"
          icon={<IconRefresh size={20} stroke={1.75} />}
          variant="secondary"
          size="lg"
          className="px-6 py-2 text-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          isLoading={refreshing}
          onClick={refreshDevices}
        />
      </HStack>
      </motion.div>

      <motion.div variants={item} className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DeviceStage
          deviceInfo={deviceInfo}
          nickname={nicknames[activeSerial]}
          onReboot={handleReboot}
        />
        <LiveTelemetry />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConnectionPanel />
        <DeviceSpecs />
      </motion.div>
    </motion.div>
  )
}
