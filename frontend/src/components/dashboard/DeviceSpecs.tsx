import { motion, useReducedMotion } from 'motion/react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import { VStack } from '@astryxdesign/core/VStack'
import { useDevices } from '@/hooks/useDevices'

interface SpecRow {
  label: string
  value?: string
}

function SpecValue({ value, index }: { value: string; index: number }) {
  const reduced = useReducedMotion()
  if (value.length <= 20) {
    return (
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.15 : 0.35, delay: reduced ? 0 : 0.35 + index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      >
        <Text type="body" weight="semibold" hasTabularNumbers>{value}</Text>
      </motion.div>
    )
  }
  return (
    <motion.div
      className="spec-marquee"
      title={value}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.15 : 0.35, delay: reduced ? 0 : 0.35 + index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="spec-marquee-track">
        <span>{value}</span>
        <span aria-hidden="true">{value}</span>
      </div>
    </motion.div>
  )
}

export function DeviceSpecs() {
  const { deviceInfo } = useDevices()

  if (!deviceInfo) {
    return (
      <div className="m3-surface p-5">
        <Heading level={2} weight="semibold">Specifications</Heading>
        <Text type="body" color="secondary">No device details available.</Text>
      </div>
    )
  }

  const groups: { title: string; rows: SpecRow[] }[] = [
    {
      title: 'Software',
      rows: [
        { label: 'Android', value: deviceInfo.androidVersion },
        { label: 'SDK level', value: deviceInfo.sdkVersion },
        { label: 'Security patch', value: deviceInfo.securityPatch },
      ],
    },
    {
      title: 'Hardware',
      rows: [
        { label: 'Manufacturer', value: deviceInfo.manufacturer },
        { label: 'Architecture', value: deviceInfo.abis },
        { label: 'Build ID', value: deviceInfo.buildId },
      ],
    },
  ]

  return (
    <div className="m3-surface p-5">
      <VStack gap={5}>
        <HStack gap={2} vAlign="center">
          <Heading level={2} weight="semibold">Specifications</Heading>
        </HStack>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {groups.flatMap((group) => group.rows).map((row, index) => (
            <div key={row.label} className="m3-inset flex min-w-0 flex-col gap-1 p-4">
              <Text type="body" color="secondary" maxLines={1}>{row.label}</Text>
              <SpecValue value={row.value || 'Unknown'} index={index} />
            </div>
          ))}
        </div>
      </VStack>
    </div>
  )
}
