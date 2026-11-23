import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  IconDeviceMobile,
  IconCamera,
  IconBox,
  IconArticle,
  IconFolderOpen,
  IconPower,
} from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import { VStack } from '@astryxdesign/core/VStack'
import { useDeviceStore } from '@/stores/useDeviceStore'
import type { DeviceInfo } from '@/lib/types'

interface DeviceStageProps {
  deviceInfo: DeviceInfo
  nickname: string | undefined
  onReboot: (mode: string) => void
}

const REBOOT_MODES = [
  { label: 'System', value: 'system' },
  { label: 'Recovery', value: 'recovery' },
  { label: 'Bootloader', value: 'bootloader' },
] as const

const SHORTCUTS = [
  { key: 'screen', label: 'Screen', icon: IconCamera, path: '/scrcpy' },
  { key: 'apps', label: 'Apps', icon: IconBox, path: '/apps' },
  { key: 'terminal', label: 'Terminal', icon: IconArticle, path: '/terminal' },
  { key: 'files', label: 'Files', icon: IconFolderOpen, path: '/files' },
] as const

function connectedSince(since: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - since) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours < 24) return remaining > 0 ? `${hours}h ${remaining}m ago` : `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// storageInfo ships as "10058248 used / 107226940 total (97037620 free, 10%)"
// (raw df 1K-blocks numbers from the Go parser)
function parseStorage(storage?: string): { usedPct: number; label: string } | null {
  if (!storage) return null
  const pctMatch = storage.match(/(\d+)%\)?\s*$/)
  const parts = storage.split('/').map((part) => part.trim())
  if (!pctMatch || parts.length < 2) return null
  const formatBlocks = (raw: string) => {
    const kb = parseInt(raw.replace(/[^\d]/g, ''), 10)
    if (!Number.isFinite(kb) || kb <= 0) return raw
    if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(1)} GB`
    if (kb >= 1024) return `${(kb / 1024).toFixed(0)} GB`
    return `${kb} KB`
  }
  const label = `${formatBlocks(parts[0].replace(/\s*used$/, ''))} of ${formatBlocks(parts[1].replace(/\s*total\s*\(.*\)$/, ''))}`
  return { usedPct: parseInt(pctMatch[1], 10), label }
}

function FluidMeter({
  label,
  value,
  caption,
  tone,
  index,
}: {
  label: string
  value: number
  caption: string
  tone: string
  index: number
}) {
  const reduced = useReducedMotion()
  const [settled, setSettled] = useState(false)
  const ratio = Math.min(100, Math.max(0, value)) / 100

  useEffect(() => {
    const id = window.setTimeout(() => setSettled(true), 1400 + index * 120)
    return () => window.clearTimeout(id)
  }, [index])

  return (
    <div className="m3-meter h-20">
      <motion.div
        className={`m3-meter-fill ${tone}`}
        initial={reduced ? { opacity: 0 } : { scaleX: 0 }}
        animate={reduced ? { opacity: 1 } : { scaleX: ratio }}
        transition={{
          duration: reduced ? 0.2 : 0.9,
          delay: settled ? 0 : 0.18 + index * 0.11,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div className="m3-meter-wave" />
        <div className="m3-meter-bubbles" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-5">
        <Text type="body" weight="medium" size="lg">{label}</Text>
        <Text type="body" weight="semibold" hasTabularNumbers size="lg">
          {caption}
        </Text>
      </div>
    </div>
  )
}

export function DeviceStage({
  deviceInfo,
  nickname,
  onReboot,
}: DeviceStageProps) {
  const navigate = useNavigate()
  const performance = useDeviceStore((state) => state.performance)
  const [rebootOpen, setRebootOpen] = useState(false)
  const connectedAt = useRef({ serial: '', at: 0 })
  const [now, setNow] = useState(Date.now())

  if (connectedAt.current.serial !== deviceInfo.serial) {
    connectedAt.current = { serial: deviceInfo.serial, at: Date.now() }
  }

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const isOnline = deviceInfo.state === 'device'
  const displayName = nickname || deviceInfo.model || deviceInfo.product || deviceInfo.serial
  const secondary = nickname
    ? (deviceInfo.model ?? deviceInfo.serial)
    : (deviceInfo.connectionLabel || deviceInfo.serial)
  const battery = deviceInfo.batteryLevel
    ? parseInt(deviceInfo.batteryLevel.replace(/%/g, ''), 10)
    : null
  const storage = parseStorage(deviceInfo.storageInfo)

  return (
    <div className="m3-surface flex h-full flex-col p-5">
      <VStack gap={5} className="h-full" justify="between">
        <VStack gap={5} className="flex-1">
          <HStack gap={4} vAlign="center" wrap="wrap">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-muted)] text-[var(--color-text-accent)]">
              <IconDeviceMobile size={28} stroke={1.5} />
            </div>
            <VStack gap={0.5} className="min-w-0 flex-1">
              <Heading level={2} type="display-3" weight="semibold" maxLines={1}>
                {displayName}
              </Heading>
              <Text type="body" color="secondary" maxLines={1}>
                {secondary}
              </Text>
              <Text type="code" color="secondary" maxLines={1}>
                {deviceInfo.serial}
              </Text>
            </VStack>
          </HStack>

          <Text type="body" color="secondary">
            {isOnline
              ? `Connected ${connectedSince(connectedAt.current.at, now)}`
              : `State: ${deviceInfo.state}`}
          </Text>

          {isOnline && battery !== null && Number.isFinite(battery) && (
            <FluidMeter
              label="Battery"
              value={battery}
              caption={`${battery}%`}
              tone={battery <= 20 ? 'bg-[var(--color-error)]' : 'bg-[var(--color-success)]'}
              index={0}
            />
          )}

          {isOnline && storage && (
            <FluidMeter
              label="Storage"
              value={storage.usedPct}
              caption={storage.label}
              tone={storage.usedPct >= 90 ? 'bg-[var(--color-error)]' : 'bg-[var(--color-accent)]'}
              index={1}
            />
          )}

          {isOnline && performance && (
            <FluidMeter
              label="Memory"
              value={performance.ramUsage}
              caption={`${performance.ramUsage.toFixed(1)}%`}
              tone={performance.ramUsage >= 85 ? 'bg-[var(--color-error)]' : 'bg-[var(--color-info)]'}
              index={2}
            />
          )}

          {isOnline && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="m3-inset flex items-center gap-2 p-3">
                <Text type="body" color="secondary">Link</Text>
                <Text type="body" weight="medium" maxLines={1}>{deviceInfo.connectionLabel || 'USB'}</Text>
              </div>
              <div className="m3-inset flex items-center gap-2 p-3">
                <Text type="body" color="secondary">Brand</Text>
                <Text type="body" maxLines={1}>{deviceInfo.brand || deviceInfo.manufacturer || 'Unknown'}</Text>
              </div>
              {deviceInfo.ipAddress && (
                <div className="m3-inset flex items-center gap-2 p-3 sm:col-span-2">
                  <Text type="body" color="secondary">Address</Text>
                  <Text type="body" hasTabularNumbers maxLines={1}>{deviceInfo.ipAddress}</Text>
                </div>
              )}
            </div>
          )}

          {isOnline && (
            <div className="flex gap-3">
              {SHORTCUTS.map((shortcut) => {
                const Icon = shortcut.icon
                return (
                  <Button
                    key={shortcut.key}
                    label={shortcut.label}
                    icon={<Icon size={28} stroke={1.5} />}
                    variant="secondary"
                    size="lg"
                    className="min-w-0 flex-1"
                    onClick={() => navigate(shortcut.path)}
                  />
                )
              })}
            </div>
          )}
        </VStack>

        <div className="flex justify-end">
          {isOnline && (
            <div className="relative">
              <Button
                label="Reboot device"
                icon={<IconPower size={22} stroke={1.5} />}
                variant="secondary"
                size="md"
                aria-expanded={rebootOpen}
                onClick={() => setRebootOpen((open) => !open)}
                className="gap-3 bg-[var(--color-accent)] px-6 text-[18px] text-[var(--color-on-accent)] hover:bg-[var(--color-accent)] aria-expanded:bg-[var(--color-accent)] aria-expanded:text-[var(--color-on-accent)]"
              />
              <div
                className="reboot-flyout"
                data-open={rebootOpen}
                aria-hidden={!rebootOpen}
              >
                {REBOOT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    tabIndex={rebootOpen ? 0 : -1}
                    onClick={() => {
                      setRebootOpen(false)
                      onReboot(mode.value)
                    }}
                    className="rounded-lg bg-[var(--color-surface-inset)] px-4 py-2 text-[16px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-accent-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </VStack>
    </div>
  )
}
