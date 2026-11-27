import { useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { IconRotate, IconSearch, IconX } from '@tabler/icons-react'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { Heading } from '@astryxdesign/core/Heading'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { RestorablePackage } from '@/lib/types'

const ROW_HEIGHT = 76

interface RestoreViewProps {
  items: RestorablePackage[]
  selectedPackages: string[]
  loading: boolean
  busyPackage: string | null
  busyBatch: boolean
  searchTerm: string
  onToggleSelect: (packageName: string) => void
  onToggleAll: (visibleNames: string[]) => void
  onRestoreSingle: (packageName: string) => void
  onRestoreBatch: () => void
  onClearSelection: () => void
}

export function RestoreView({
  items,
  selectedPackages,
  loading,
  busyPackage,
  busyBatch,
  searchTerm,
  onToggleSelect,
  onToggleAll,
  onRestoreSingle,
  onRestoreBatch,
  onClearSelection,
}: RestoreViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  const visibleNames = useMemo(() => items.map((i) => i.packageName), [items])
  const selectedSet = useMemo(() => new Set(selectedPackages), [selectedPackages])
  const selectedVisibleCount = useMemo(
    () => visibleNames.filter((name) => selectedSet.has(name)).length,
    [visibleNames, selectedSet],
  )
  const isAllSelected =
    visibleNames.length > 0 && selectedVisibleCount === visibleNames.length

  return (
    <>
      <div className="m3-surface px-4 py-2.5 text-[13px] text-[var(--color-text-secondary)]">
        Lists system packages uninstalled for user 0. Restore runs <code className="font-mono text-[var(--color-text-primary)]">cmd package install-existing</code> without a factory reset.
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="m3-surface h-full space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={64} width="100%" radius={4} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="m3-surface flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]">
              {searchTerm.trim() ? <IconSearch size={30} stroke={1.5} /> : <IconRotate size={30} stroke={1.5} />}
            </div>
            <VStack gap={1}>
              <Heading level={2} weight="semibold">
                {searchTerm.trim() ? 'No matching packages' : 'No uninstalled system packages'}
              </Heading>
              <Text type="body" color="secondary">
                {searchTerm.trim()
                  ? `Nothing matched “${searchTerm}”.`
                  : 'All system packages on this device are currently installed for user 0.'}
              </Text>
            </VStack>
          </div>
        ) : (
          <motion.div
            className="m3-surface flex h-full flex-col overflow-hidden"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-border/40 px-6 py-3">
              <CheckboxInput
                value={isAllSelected}
                onChange={() => onToggleAll(visibleNames)}
                size="sm"
                label="Select all restorable packages"
                isLabelHidden
              />
              <span className="text-[14px] font-semibold text-[var(--color-text-secondary)]">
                {selectedVisibleCount > 0
                  ? `${selectedVisibleCount} of ${visibleNames.length} selected`
                  : `${visibleNames.length} restorable package(s)`}
              </span>
            </div>

            <div ref={parentRef} className="perf-scroll min-h-0 flex-1 overflow-auto">
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const item = items[virtualRow.index]
                  if (!item) return null
                  const isSelected = selectedSet.has(item.packageName)
                  const isRowBusy = busyBatch || busyPackage === item.packageName

                  return (
                    <div
                      key={item.packageName}
                      data-index={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translate3d(0, ${virtualRow.start}px, 0)`,
                      }}
                      onClick={() => onToggleSelect(item.packageName)}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-4 border-b border-border/20 border-l-2 px-6 transition-colors hover:bg-[var(--color-background-muted)]',
                        isSelected
                          ? 'border-l-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]'
                          : 'border-l-transparent',
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3.5">
                        <div onClick={(e) => e.stopPropagation()}>
                          <CheckboxInput
                            value={isSelected}
                            onChange={() => onToggleSelect(item.packageName)}
                            size="sm"
                            label={`Select ${item.packageName}`}
                            isLabelHidden
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-[16px] font-semibold text-[var(--color-text-primary)]">
                              {item.appName ?? item.packageName}
                            </span>
                            {item.appName && (
                              <span className="truncate font-mono text-[13px] text-[var(--color-text-secondary)]">
                                {item.packageName}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="mt-0.5 truncate text-[13px] text-[var(--color-text-secondary)]">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className="flex shrink-0 items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Badge
                          variant={item.inCatalog ? 'neutral' : 'warning'}
                          label={item.inCatalog ? item.category ?? 'Catalog' : 'Unlisted'}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<IconRotate size={15} stroke={1.75} />}
                          label="Restore"
                          isLoading={busyPackage === item.packageName}
                          isDisabled={isRowBusy}
                          onClick={() => onRestoreSingle(item.packageName)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedPackages.length > 0 && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 56 }}
            transition={reduced ? { duration: 0.12 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="pointer-events-none fixed inset-x-0 bottom-10 z-40 flex justify-center px-6"
          >
            <div className="pointer-events-auto flex items-center gap-3 rounded-3xl border border-border/40 bg-card py-3 pl-7 pr-3 shadow-[var(--shadow-floating)]">
              <span className="shrink-0 text-m font-bold tracking-tight text-[var(--color-text-primary)]">
                {selectedPackages.length} selected
              </span>

              <div className="h-6 w-px shrink-0 bg-border/50" />

              <Button
                size="sm"
                variant="primary"
                isDisabled={busyBatch}
                isLoading={busyBatch}
                onClick={onRestoreBatch}
                className="h-10 gap-2 rounded-full px-6 text-[14px] font-bold"
                icon={<IconRotate size={18} stroke={1.75} />}
                label="Restore selected"
              />

              <button
                type="button"
                aria-label="Clear selection"
                onClick={onClearSelection}
                disabled={busyBatch}
                className={cn(
                  'ml-1 flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)]',
                  busyBatch && 'pointer-events-none opacity-40',
                )}
              >
                <IconX size={17} stroke={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
