import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  IconRotate,
  IconShield,
  IconPower,
  IconCamera,
  IconCpu,
  IconWifi,
  IconDeviceSdCard,
  IconChevronDown,
  IconBattery,
  IconThermometer,
  IconUsb,
  IconClock,
  IconDatabase,
  IconInfoCircle,
  IconTag,
  IconBuildingFactory,
  IconHash,
  IconShieldCheck,
  IconDeviceMobile,
} from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import { VStack } from '@astryxdesign/core/VStack'
import { useDevices } from '@/hooks/useDevices'
import { useMetricsHistoryStore } from '@/stores/metricsHistoryStore'
import { rebootDevice, takeDeviceScreenshot } from '@/services/deviceService'
import { selectSaveFile } from '@/services/fileService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DeviceInfo, PerformanceSnapshot } from '@/lib/types'

interface DeviceInspectorProps {
  snapshot: PerformanceSnapshot | null
  monitorError: string | null
  onRename: () => void
}

const REBOOT_MODES = [
  { mode: 'system', label: 'Reboot System', icon: IconRotate },
  { mode: 'bootloader', label: 'Bootloader', icon: IconShield },
  { mode: 'recovery', label: 'Recovery', icon: IconPower },
  { mode: 'fastboot', label: 'Reboot Fastbootd', icon: IconRotate },
] as const

function buildSpecs(info: DeviceInfo): { label: string; value: string; icon: React.ElementType }[] {
  const rows: { label: string; value: string; icon: React.ElementType }[] = []
  const isWireless = /^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(info.serial)
  if (info.model) rows.push({ label: 'Model', value: info.model, icon: IconDeviceMobile })
  if (info.brand) rows.push({ label: 'Brand', value: info.brand, icon: IconTag })
  if (info.manufacturer) rows.push({ label: 'Maker', value: info.manufacturer, icon: IconBuildingFactory })
  if (info.codename) rows.push({ label: 'Codename', value: info.codename, icon: IconInfoCircle })
  if (info.androidVersion) rows.push({ label: 'Android', value: info.androidVersion, icon: IconDeviceMobile })
  if (info.sdkVersion) rows.push({ label: 'SDK', value: `API ${info.sdkVersion}`, icon: IconInfoCircle })
  if (info.buildId) rows.push({ label: 'Build ID', value: info.buildId, icon: IconHash })
  if (info.securityPatch) rows.push({ label: 'Patch', value: info.securityPatch, icon: IconShieldCheck })
  if (info.abis) rows.push({ label: 'ABI', value: info.abis, icon: IconCpu })
  if (info.serial) rows.push({ label: 'Serial', value: info.serial, icon: IconHash })
  if (info.ramTotal) rows.push({ label: 'RAM', value: info.ramTotal, icon: IconDeviceSdCard })
  if (info.rootStatus) rows.push({ label: 'Root', value: info.rootStatus, icon: IconShieldCheck })
  if (info.product) rows.push({ label: 'Product', value: info.product, icon: IconInfoCircle })
  rows.push({ label: 'Mode', value: isWireless ? 'Wi-Fi' : 'USB', icon: IconWifi })
  return rows
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const kb = 1024
  if (bytes >= kb * kb * kb) return `${(bytes / (kb * kb * kb)).toFixed(2)} GB`
  if (bytes >= kb * kb) return `${(bytes / (kb * kb)).toFixed(1)} MB`
  return `${(bytes / kb).toFixed(0)} KB`
}

function formatRate(bytesPerSecond?: number): string {
  if (!bytesPerSecond || bytesPerSecond <= 0) return '0 B/s'
  return `${formatBytes(bytesPerSecond)}/s`
}

function MeterCard({
  label,
  value,
  caption,
  tone,
  icon,
  index,
}: {
  label: string
  value: number
  caption: string
  tone: string
  icon: React.ReactNode
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
    <div className="m3-inset flex flex-col gap-2 p-3 focus-within:outline-2 focus-within:outline-[var(--color-accent)] disabled:opacity-50" aria-disabled="false">
      <HStack gap={2} vAlign="center">
        {icon}
        <Text type="body" color="secondary">{label}</Text>
      </HStack>
      <div className="m3-meter h-10">
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end px-3">
          <Text type="body" weight="semibold" hasTabularNumbers>{caption}</Text>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="m3-inset flex flex-col gap-2 p-4 focus-within:outline-2 focus-within:outline-[var(--color-accent)]">
      <HStack gap={2} vAlign="center">
        {icon}
        <Text type="body" color="secondary">{label}</Text>
      </HStack>
      <Text type="body" weight="semibold" hasTabularNumbers size="xl">{value}</Text>
    </div>
  )
}

function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <div className="flex h-12 items-center"><span className="text-[14px] text-[var(--color-text-secondary)]">Collecting…</span></div>
  }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const width = 200
  const height = 48
  const pad = 2
  const points = values.map((val, i) => ({
    x: pad + (i / (values.length - 1)) * (width - pad * 2),
    y: height - pad - ((val - min) / range) * (height - pad * 2),
  }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]
  const fillPath = `${line} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-12 w-full" aria-hidden="true">
      <motion.path
        d={fillPath}
        fill={color}
        initial={false}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

function TelemetryTile({ icon, label, value, sublabel, values, color, index }: {
  icon: React.ReactNode
  label: string
  value: string
  sublabel?: string
  values: number[]
  color: string
  index: number
}) {
  return (
    <motion.div
      className="m3-inset flex min-w-0 flex-col gap-2 p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <HStack gap={2} vAlign="center">
        {icon}
        <Text type="body" color="secondary">{label}</Text>
      </HStack>
      <Text weight="semibold" hasTabularNumbers size="2xl">{value}</Text>
      <Sparkline values={values} color={color} />
      {sublabel && <Text type="body" color="secondary" hasTabularNumbers>{sublabel}</Text>}
    </motion.div>
  )
}

export function DeviceInspector({ snapshot, monitorError, onRename }: DeviceInspectorProps) {
  const { activeSerial, deviceInfo, nicknames, refreshing, refreshDevices } = useDevices()
  const cpuHistory = useMetricsHistoryStore((s) => s.cpuHistory)
  const ramHistory = useMetricsHistoryStore((s) => s.ramHistory)
  const rxHistory = useMetricsHistoryStore((s) => s.rxHistory)
  const [busy, setBusy] = useState(false)
  const [showAllSpecs, setShowAllSpecs] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  void monitorError
  void onRename

  const specs = deviceInfo ? buildSpecs(deviceInfo) : []
  const shownSpecs = showAllSpecs ? specs : specs.slice(0, 4)

  const specTile = (spec: { label: string; value: string; icon: React.ElementType }, index: number) => (
    <motion.button
      key={spec.label}
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(spec.value)
        setCopied(spec.label)
        window.setTimeout(() => setCopied(null), 1200)
      }}
      initial={false}
      animate={{ opacity: 1 }}
      style={{ transitionDelay: `${index * 30}ms` }}
      title={copied === spec.label ? 'Copied' : 'Copy'}
      className="m3-inset flex min-w-0 flex-col gap-2 p-4 text-left transition-[transform,opacity] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
    >
      <HStack gap={2} vAlign="center">
        <spec.icon size={16} stroke={1.75} className="shrink-0 text-[var(--color-text-secondary)]" />
        <Text type="body" color="secondary">{spec.label}</Text>
      </HStack>
      <Text type="body" weight="semibold" hasTabularNumbers maxLines={1}>{spec.value}</Text>
    </motion.button>
  )

  const name = activeSerial
    ? nicknames[activeSerial] || deviceInfo?.model || deviceInfo?.product || activeSerial
    : ''
  const serial = activeSerial ?? ''

  const totalStorage = snapshot?.storageTotalBytes ?? 0
  const usedStorage = snapshot?.storageUsedBytes ?? 0
  const freeStorage = totalStorage > usedStorage ? totalStorage - usedStorage : 0
  const storagePercent = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0

  async function handleReboot(mode: string) {
    if (!activeSerial) return
    setBusy(true)
    try {
      const message = await rebootDevice(activeSerial, mode)
      toast.success('Reboot command executed', { description: message })
    } catch (e) {
      toast.error('Reboot failed', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  async function handleScreenshot() {
    if (!activeSerial) return
    const path = await selectSaveFile(`screenshot-${Date.now()}.png`)
    if (!path.trim()) return
    setBusy(true)
    try {
      const message = await takeDeviceScreenshot(activeSerial, path)
      toast.success('Screenshot saved', { description: message })
    } catch (e) {
      toast.error('Screenshot failed', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <VStack gap={4}>
      <div className="m3-surface p-5">
        <HStack gap={3} vAlign="center" wrap="wrap">
          <div className="min-w-0 flex-1">
            <Heading level={2} type="display-2" weight="semibold" maxLines={1}>{name}</Heading>
            <HStack gap={3} vAlign="center" wrap="wrap" className="mt-1">
              <IconDeviceMobile size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />
              <Text type="code" color="secondary" maxLines={1}>{serial}</Text>
              {snapshot && (
                <HStack gap={2} vAlign="center">
                  <IconClock size={16} className="text-[var(--color-text-secondary)]" />
                  <Text type="body" color="secondary" hasTabularNumbers>Uptime {formatUptime(snapshot.uptimeSeconds)}</Text>
                </HStack>
              )}
            </HStack>
          </div>
          <Button label="Refresh" variant="secondary" isLoading={refreshing} onClick={refreshDevices} />
        </HStack>
      </div>

      <div className="m3-surface p-5">
        <HStack gap={2} wrap="wrap">
          {REBOOT_MODES.map(({ mode, label, icon: Icon }) => (
            <Button key={mode} label={label} icon={<Icon size={16} stroke={1.75} />} variant="secondary" onClick={() => handleReboot(mode)} isDisabled={busy} />
          ))}
          <Button label="Screenshot" icon={<IconCamera size={16} stroke={1.75} />} variant="secondary" onClick={handleScreenshot} isDisabled={busy} />
        </HStack>
      </div>

      {snapshot && (
        <div className="m3-surface p-5">
          <VStack gap={4}>
            <Heading level={2} weight="semibold">Performance telemetry</Heading>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <TelemetryTile
                icon={<IconCpu size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />}
                label="CPU activity"
                value={`${snapshot.cpuUsage.toFixed(1)}%`}
                values={cpuHistory}
                color="var(--chart-primary)"
                index={0}
              />
              <TelemetryTile
                icon={<IconDeviceSdCard size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />}
                label="RAM utilization"
                value={`${snapshot.ramUsage.toFixed(1)}%`}
                sublabel={snapshot.ramUsedBytes && snapshot.ramTotalBytes ? `${formatBytes(snapshot.ramUsedBytes)} / ${formatBytes(snapshot.ramTotalBytes)}` : undefined}
                values={ramHistory}
                color="var(--chart-secondary)"
                index={1}
              />
              <TelemetryTile
                icon={<IconWifi size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />}
                label="Network link"
                value={`↓ ${formatRate(snapshot.networkRxSec)}`}
                sublabel={`↑ ${formatRate(snapshot.networkTxSec)}`}
                values={rxHistory}
                color="var(--chart-tertiary)"
                index={2}
              />
            </div>
          </VStack>
        </div>
      )}

      {snapshot && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="m3-surface p-5">
            <VStack gap={4}>
              <HStack gap={2} vAlign="center">
                <IconBattery size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />
                <Heading level={2} weight="semibold">Power and thermals</Heading>
              </HStack>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MeterCard
                  label="Charge capacity"
                  value={snapshot.batteryLevel ?? 0}
                  caption={`${snapshot.batteryLevel ?? 0}%`}
                  tone={(snapshot.batteryLevel ?? 0) <= 20 ? 'bg-[var(--color-error)]' : 'bg-[var(--color-success)]'}
                  icon={<IconBattery size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />}
                  index={0}
                />
                <StatCard label="Battery temperature" value={snapshot.batteryTemperatureC !== undefined ? `${snapshot.batteryTemperatureC.toFixed(1)}°C` : '—'} icon={<IconThermometer size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />} />
                <StatCard label="Power delivery" value="USB connection" icon={<IconUsb size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />} />
                <StatCard label="System uptime" value={formatUptime(snapshot.uptimeSeconds)} icon={<IconClock size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />} />
              </div>
            </VStack>
          </div>

          <div className="m3-surface p-5">
            <VStack gap={4}>
              <HStack gap={2} vAlign="center">
                <IconDatabase size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />
                <Heading level={2} weight="semibold">Storage status</Heading>
              </HStack>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MeterCard
                  label="Internal disk"
                  value={storagePercent}
                  caption={formatBytes(usedStorage)}
                  tone={storagePercent >= 90 ? 'bg-[var(--color-error)]' : 'bg-[var(--color-accent)]'}
                  icon={<IconDatabase size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />}
                  index={0}
                />
                <StatCard label="Available storage" value={formatBytes(freeStorage)} icon={<IconDeviceSdCard size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />} />
                <StatCard label="Capacity remaining" value={`${(100 - storagePercent).toFixed(1)}% free`} icon={<IconDatabase size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />} />
                <StatCard label="Swap" value={deviceInfo?.swapTotal ?? '—'} icon={<IconDeviceSdCard size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />} />
              </div>
            </VStack>
          </div>
        </div>
      )}

      {specs.length > 0 && (
        <div className="m3-surface p-5">
          <VStack gap={4}>
            <HStack gap={2} vAlign="center">
              <Heading level={2} weight="semibold">Specifications</Heading>
              <Button
                label={showAllSpecs ? 'Less' : 'All details'}
                icon={<IconChevronDown size={16} stroke={1.75} className={cn('transition-transform', showAllSpecs && 'rotate-180')} />}
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setShowAllSpecs((v) => !v)}
              />
            </HStack>
            <div className="relative overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={showAllSpecs ? 'all' : 'few'}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {shownSpecs.map(specTile)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </VStack>
        </div>
      )}
    </VStack>
  )
}
