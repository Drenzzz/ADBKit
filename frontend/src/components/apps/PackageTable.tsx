import { useMemo, useRef } from 'react'
import { motion } from 'motion/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { PackageRow } from './PackageRow'
import { PackageActions } from './PackageActions'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { PackageInfo, PackageDetails } from '@/lib/types'

const ROW_HEIGHT = 68

interface PackageTableProps {
  packages: PackageInfo[]
  selectedPackages: string[]
  busyPackageName: string | null
  loading: boolean
  detailsCache: Map<string, PackageDetails>
  onToggleSelect: (name: string) => void
  onToggleAll: (names: string[]) => void
  onPermissions: (name: string) => void
  onDetails: (name: string) => void
  onLaunch: (name: string) => void
  onForceStop: (name: string) => void
  onToggleEnabled: (name: string) => void
  onClearData: (name: string) => void
  onPullApk: (name: string) => void
  onUninstall: (name: string) => void
  loadDetails: (name: string) => void
}

export function PackageTable({
  packages,
  selectedPackages,
  busyPackageName,
  loading,
  detailsCache,
  onToggleSelect,
  onToggleAll,
  onPermissions,
  onDetails,
  onLaunch,
  onForceStop,
  onToggleEnabled,
  onClearData,
  onPullApk,
  onUninstall,
  loadDetails,
}: PackageTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const virtualizer = useVirtualizer({
    count: packages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  const totalHeight = virtualizer.getTotalSize()

  const allNames = useMemo(() => packages.map((p) => p.packageName), [packages])
  const selectedCount = useMemo(
    () => allNames.filter((name) => selectedPackages.includes(name)).length,
    [allNames, selectedPackages],
  )
  const isAllSelected = allNames.length > 0 && selectedCount === allNames.length
  const isSomeSelected = selectedCount > 0 && !isAllSelected

  if (loading && packages.length === 0) {
    return (
      <div className="m3-surface min-h-0 flex-1 overflow-hidden">
        <div className="space-y-0 p-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="mb-2">
              <Skeleton height={60} width="100%" radius={4} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="m3-surface flex min-h-0 flex-1 flex-col overflow-hidden"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header: select-all + count */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/40 px-6 py-3">
        <CheckboxInput
          value={isAllSelected}
          onChange={() => onToggleAll(allNames)}
          size="sm"
          label="Select all visible packages"
          isLabelHidden
        />
        <span className="text-[14px] font-semibold tracking-normal text-[var(--color-text-secondary)]">
          {isSomeSelected ? `${selectedCount} of ${allNames.length} selected` : 'Package'}
        </span>
      </div>

      {/* Body (virtualized) */}
      <div ref={parentRef} className="perf-scroll min-h-0 flex-1 overflow-auto">
        <div
          style={{
            height: `${totalHeight}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const pkg = packages[virtualRow.index]
            if (!pkg) return null

            const isSelected = selectedPackages.includes(pkg.packageName)
            const isBusy = busyPackageName === pkg.packageName
            const details = detailsCache.get(pkg.packageName)

            return (
              <div
                key={pkg.packageName}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translate3d(0, ${virtualRow.start}px, 0)`,
                }}
                className={cn(
                  'group flex h-full items-center border-l-2 transition-[background-color,border-color] duration-150 ease-out hover:bg-[var(--color-background-muted)]',
                  isSelected
                    ? 'border-l-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]'
                    : 'border-l-transparent',
                  isBusy && 'pointer-events-none opacity-60',
                )}
              >
                  <PackageRow
                    pkg={pkg}
                    details={details}
                    loadDetails={loadDetails}
                    onToggleSelect={onToggleSelect}
                  />
                <div
                  className="flex shrink-0 items-center pr-4"
                  onClick={(e) => e.stopPropagation()}
                >
                    <PackageActions
                      packageName={pkg.packageName}
                      isEnabled={pkg.isEnabled}
                      isBusy={isBusy}
                      onPermissions={onPermissions}
                      onDetails={onDetails}
                      onLaunch={onLaunch}
                      onForceStop={onForceStop}
                      onToggleEnabled={onToggleEnabled}
                      onClearData={onClearData}
                      onPullApk={onPullApk}
                      onUninstall={onUninstall}
                    />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
