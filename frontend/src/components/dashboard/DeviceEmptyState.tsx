import { IconDeviceMobile, IconRefresh } from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'

interface DeviceEmptyStateProps {
  refreshing: boolean
  onRefresh: () => void
}

export function DeviceEmptyState({ refreshing, onRefresh }: DeviceEmptyStateProps) {
  return (
    <div className="m3-surface h-full p-6">
      <VStack gap={4} hAlign="center" className="min-h-[280px] justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]">
          <IconDeviceMobile size={32} stroke={1.5} />
        </div>
        <VStack gap={1}>
          <Heading level={2} weight="semibold">No device connected</Heading>
          <Text type="body" color="secondary">
            Connect an Android device over USB with debugging enabled, or use the wireless panel below.
          </Text>
        </VStack>
        <Button
          label="Scan devices"
          icon={<IconRefresh size={16} stroke={1.75} />}
          variant="secondary"
          isLoading={refreshing}
          onClick={onRefresh}
        />
      </VStack>
    </div>
  )
}
