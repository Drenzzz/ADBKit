import { motion, useReducedMotion } from 'motion/react'
import {
  IconActivity,
  IconCpu,
  IconDeviceSdCard,
  IconLoader2,
  IconWifi,
} from '@tabler/icons-react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import { VStack } from '@astryxdesign/core/VStack'
import { useMetricsHistoryStore } from '@/stores/metricsHistoryStore'
import { useDevices } from '@/hooks/useDevices'
import { useMonitor } from '@/hooks/useMonitor'

const WIDTH = 320
const HEIGHT = 140

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

function formatUptime(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function CpuChart({ values }: { values: number[] }) {
  const reduced = useReducedMotion()
  if (values.length < 2) {
    return (
      <div className="m3-inset flex h-36 items-center justify-center p-2">
        <Text type="body" color="secondary">Collecting samples...</Text>
      </div>
    )
  }

  const latest = values[values.length - 1]
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * WIDTH
      const y = HEIGHT - (Math.min(100, Math.max(0, value)) / 100) * HEIGHT
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const lastX = WIDTH
  const lastY = HEIGHT - (Math.min(100, Math.max(0, latest)) / 100) * HEIGHT

  return (
    <div className="m3-inset relative p-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-36 w-full"
        aria-hidden="true"
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={WIDTH}
            y1={HEIGHT * fraction}
            y2={HEIGHT * fraction}
            stroke="var(--color-border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <motion.polyline
          points={points}
          fill="none"
          stroke="var(--chart-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0 : 1.1, delay: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
        <circle cx={lastX - 2} cy={lastY} r={4} fill="var(--chart-primary)" />
      </svg>
      <div
        // Live dot pulse: the only looping animation on the page.
        aria-hidden="true"
        className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--chart-primary)] animate-pulse motion-reduce:animate-none"
      />
    </div>
  )
}

export function LiveTelemetry() {
  const { activeSerial, deviceInfo } = useDevices()
  const online = deviceInfo?.state === 'device'
  const { snapshot, polling, error } = useMonitor(activeSerial, online)
  const cpuHistory = useMetricsHistoryStore((state) => state.cpuHistory)
  const uptime = formatUptime(snapshot?.uptimeSeconds)

  return (
    <div className="m3-surface p-5">
      <VStack gap={4}>
        <HStack gap={2} vAlign="center">
          <IconActivity size={18} stroke={1.75} className="text-[var(--color-text-secondary)]" />
          <Heading level={2} weight="semibold">Live monitor</Heading>
          {polling && <IconLoader2 size={16} className="ml-auto animate-spin text-[var(--color-text-secondary)]" />}
        </HStack>

        {!online ? (
          <VStack gap={3} className="flex-1 justify-center">
            <Text type="body" color="secondary">Waiting for an active device.</Text>
          </VStack>
        ) : error ? (
          <Text type="body" className="text-[var(--color-error)]">{error}</Text>
        ) : !snapshot ? (
          <HStack gap={2} vAlign="center">
            <IconLoader2 size={16} className="animate-spin text-[var(--color-text-secondary)]" />
            <Text type="body" color="secondary">Starting diagnostics...</Text>
          </HStack>
        ) : (
          <VStack gap={5} className="flex-1">
            <VStack gap={2} className="flex-1">
              <HStack gap={2} vAlign="center">
                <IconCpu size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />
                <Text type="body" color="secondary">CPU usage</Text>
              </HStack>
              <Text size="4xl" weight="semibold" hasTabularNumbers>
                {snapshot.cpuUsage.toFixed(1)}%
              </Text>
              <CpuChart values={cpuHistory} />
            </VStack>

            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <IconDeviceSdCard size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />
                <Text type="body" color="secondary">Memory</Text>
              </HStack>
              <HStack gap={2} vAlign="end">
                <Text size="xl" hasTabularNumbers>{snapshot.ramUsage.toFixed(1)}%</Text>
                {snapshot.ramUsedBytes && snapshot.ramTotalBytes && (
                  <Text type="body" color="secondary" hasTabularNumbers>
                    {formatBytes(snapshot.ramUsedBytes)} / {formatBytes(snapshot.ramTotalBytes)}
                  </Text>
                )}
              </HStack>
            </VStack>

            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <IconWifi size={16} stroke={1.75} className="text-[var(--color-text-secondary)]" />
                <Text type="body" color="secondary">Network</Text>
              </HStack>
              <HStack gap={4} wrap="wrap">
                <Text type="body" hasTabularNumbers>↓ {formatRate(snapshot.networkRxSec)}</Text>
                <Text type="body" color="secondary" hasTabularNumbers>↑ {formatRate(snapshot.networkTxSec)}</Text>
              </HStack>
            </VStack>

            {(uptime || snapshot.batteryTemperatureC !== undefined) && (
              <HStack gap={5} wrap="wrap" className="pt-3">
                {uptime && (
                  <VStack gap={0.5}>
                    <Text type="body" color="secondary">Uptime</Text>
                    <Text type="body" hasTabularNumbers>{uptime}</Text>
                  </VStack>
                )}
                {snapshot.batteryTemperatureC !== undefined && (
                  <VStack gap={0.5}>
                    <Text type="body" color="secondary">Battery temp</Text>
                    <Text type="body" hasTabularNumbers>{snapshot.batteryTemperatureC.toFixed(1)}°C</Text>
                  </VStack>
                )}
              </HStack>
            )}
          </VStack>
        )}
      </VStack>
    </div>
  )
}
