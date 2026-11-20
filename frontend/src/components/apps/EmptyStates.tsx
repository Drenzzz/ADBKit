import {
  IconDeviceMobile,
  IconPackageImport,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react"
import { motion } from 'motion/react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { useReducedMotion } from '@/hooks/useReducedMotion'

function EmptyShell({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 300, damping: 28 }}
      className="m3-surface flex h-full flex-col items-center justify-center gap-5 p-8 text-center"
    >
      {children}
    </motion.div>
  )
}

function EmptyIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]">
      {children}
    </div>
  )
}

export function NoDeviceState({ onRefresh, refreshing }: { onRefresh?: () => void; refreshing?: boolean }) {
  return (
    <EmptyShell>
      <EmptyIcon>
        <IconDeviceMobile size={36} stroke={1.5} />
      </EmptyIcon>
      <VStack gap={1}>
        <Heading level={2} weight="semibold">No device connected</Heading>
        <Text type="body" color="secondary">Connect an Android device to manage packages</Text>
      </VStack>
      {onRefresh && (
        <Button
          label={refreshing ? 'Scanning…' : 'Refresh devices'}
          icon={<IconRefresh size={18} stroke={1.75} className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined} />}
          variant="primary"
          isDisabled={refreshing}
          onClick={onRefresh}
        />
      )}
    </EmptyShell>
  )
}
export function NoPackagesState({ filter }: { filter: string }) {
  return (
    <EmptyShell>
      <EmptyIcon>
        <IconPackageImport size={36} stroke={1.5} />
      </EmptyIcon>
      <VStack gap={1}>
        <Heading level={2} weight="semibold">No packages found</Heading>
        <Text type="body" color="secondary">
          {filter === 'user'
            ? 'No user-installed apps detected'
            : filter === 'system'
              ? 'No system packages detected'
              : 'No packages detected on this device'}
        </Text>
      </VStack>
    </EmptyShell>
  )
}

export function NoSearchResultsState({ term }: { term: string }) {
  return (
    <EmptyShell>
      <EmptyIcon>
        <IconSearch size={36} stroke={1.5} />
      </EmptyIcon>
      <VStack gap={1}>
        <Heading level={2} weight="semibold">No results</Heading>
        <Text type="body" color="secondary">
          Nothing matched “{term}”. Try a different search term.
        </Text>
      </VStack>
    </EmptyShell>
  )
}
