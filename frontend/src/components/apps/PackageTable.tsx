import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { PackageRow } from './PackageRow'
import type { PackageInfo, PackageDetails } from '@/lib/types'

const ROW_HEIGHT = 48

interface PackageTableProps {
  packages: PackageInfo[]
  selectedPackages: string[]
  busyPackageName: string | null
  loading: boolean
  detailsCache: Map<string, PackageDetails>
  onToggleSelect: (name: string) => void
  onToggleAll: (names: string[]) => void
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

  const virtualizer = useVirtualizer({
    count: packages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  const totalHeight = virtualizer.getTotalSize()

  const allNames = useMemo(() => packages.map((p) => p.packageName), [packages])
  const isAllSelected = useMemo(() => {
    if (allNames.length === 0) return false
    return allNames.every((name) => selectedPackages.includes(name))
  }, [allNames, selectedPackages])

  const isSomeSelected = useMemo(() => {
    if (allNames.length === 0) return false
    const count = allNames.filter((name) => selectedPackages.includes(name)).length
    return count > 0 && count < allNames.length
  }, [allNames, selectedPackages])

  if (loading && packages.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-muted/10">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-0 p-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden flex-1 min-h-0 flex flex-col">
      {/* Table Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 bg-muted/20 shrink-0">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={() => onToggleAll(allNames)}
          className="h-4 w-4 shrink-0"
          aria-label="Select all visible packages"
        />
        {isSomeSelected && (
          <span className="text-[10px] text-muted-foreground -ml-1">partial</span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24">
          Status
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          Package
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24 text-right">
          Size
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20 text-right">
          Actions
        </span>
      </div>

      {/* Table Body (Virtualized) */}
      <div
        ref={parentRef}
        className="perf-scroll overflow-auto flex-1 min-h-0"
      >
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
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translate3d(0, ${virtualRow.start}px, 0)`,
                }}
              >
                <PackageRow
                  pkg={pkg}
                  details={details}
                  isSelected={isSelected}
                  isBusy={isBusy}
                  onToggleSelect={onToggleSelect}
                  onDetails={onDetails}
                  onLaunch={onLaunch}
                  onForceStop={onForceStop}
                  onToggleEnabled={onToggleEnabled}
                  onClearData={onClearData}
                  onPullApk={onPullApk}
                  onUninstall={onUninstall}
                  loadDetails={loadDetails}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
