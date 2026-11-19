import { useState } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { IconDeviceMobile, IconDevices } from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { DeviceInspector } from '@/components/devices/DeviceInspector'
import { DeviceManagerSheet } from '@/components/devices/DeviceManagerSheet'
import { RenameDialog } from '@/components/devices/RenameDialog'
import { useDevices } from '@/hooks/useDevices'
import { useMonitor } from '@/hooks/useMonitor'

export default function DevicesPage() {
  const reduced = useReducedMotion()
  const { devices, activeSerial, deviceInfo, nicknames, deviceMode } = useDevices()
  const [renameOpen, setRenameOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)

  const isOnline = deviceMode === 'adb' && deviceInfo?.state === 'device'
  const { snapshot, error: monitorError } = useMonitor(activeSerial ?? '', isOnline)

  return (
    <div className="dashboard-scale js relative flex h-full flex-col gap-4 overflow-hidden p-5">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <Heading level={1} type="display-1" weight="semibold" maxLines={1}>
          Devices
        </Heading>
        <Button
          label="Manage devices"
          icon={<IconDevices size={18} stroke={1.75} />}
          variant="secondary"
          className="focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] active:scale-[0.98] disabled:opacity-50"
          onClick={() => setManagerOpen(true)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {activeSerial && deviceInfo ? (
          <motion.div
            key={activeSerial}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.18 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <DeviceInspector snapshot={snapshot} monitorError={monitorError} onRename={() => setRenameOpen(true)} />
          </motion.div>
        ) : (
          <div className="m3-surface flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]">
              <IconDeviceMobile size={32} stroke={1.5} />
            </div>
            <VStack gap={1}>
              <Heading level={2} weight="semibold">No device detected</Heading>
              <Text type="body" color="secondary">
                {devices.length > 0
                  ? 'Select a connected device to inspect its details and telemetry.'
                  : 'Connect a device over USB or pair one wirelessly. Detection runs automatically.'}
              </Text>
            </VStack>
            <Button
              label="Manage devices"
              icon={<IconDevices size={18} stroke={1.75} />}
              variant="primary"
              className="focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] active:scale-[0.98] disabled:opacity-50"
              onClick={() => setManagerOpen(true)}
            />
          </div>
        )}
      </div>

      <DeviceManagerSheet open={managerOpen} onClose={() => setManagerOpen(false)} />

      {renameOpen && activeSerial && (
        <RenameDialog
          serial={activeSerial}
          currentNickname={nicknames[activeSerial] ?? ''}
          onClose={() => setRenameOpen(false)}
        />
      )}
    </div>
  )
}
