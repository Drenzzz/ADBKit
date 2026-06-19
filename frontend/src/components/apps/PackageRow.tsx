import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { PackageActions } from './PackageActions'
import type { PackageInfo, PackageDetails } from '@/lib/types'

interface PackageRowProps {
  pkg: PackageInfo
  details: PackageDetails | undefined
  isSelected: boolean
  isBusy: boolean
  onToggleSelect: (name: string) => void
  onDetails: (name: string) => void
  onLaunch: (name: string) => void
  onForceStop: (name: string) => void
  onToggleEnabled: (name: string) => void
  onClearData: (name: string) => void
  onPullApk: (name: string) => void
  onUninstall: (name: string) => void
  loadDetails: (name: string) => void
}

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes < 0) return '—'
  if (bytes === 0) return '0 B'
  const kb = 1024
  const mb = kb * 1024
  const gb = mb * 1024
  if (bytes >= gb) return `${(bytes / gb).toFixed(1)} GB`
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`
  return `${(bytes / kb).toFixed(0)} KB`
}

export function PackageRow({
  pkg,
  details,
  isSelected,
  isBusy,
  onToggleSelect,
  onDetails,
  onLaunch,
  onForceStop,
  onToggleEnabled,
  onClearData,
  onPullApk,
  onUninstall,
  loadDetails,
}: PackageRowProps) {
  const isDisabled = !pkg.isEnabled

  useEffect(() => {
    loadDetails(pkg.packageName)
  }, [pkg.packageName, loadDetails])

  const sizeLabel = details ? formatSize(details.totalSizeBytes) : '—'
  const versionLabel = details?.versionName ?? ''

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 border-b border-border/30 transition-colors duration-150',
        'hover:bg-muted/50 cursor-pointer h-12',
        isSelected && 'bg-primary/[0.04] border-l-2 border-l-primary',
        isDisabled && 'opacity-50 grayscale'
      )}
      onClick={() => onToggleSelect(pkg.packageName)}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelect(pkg.packageName)}
        className="h-4 w-4 shrink-0"
        aria-label={`Select ${pkg.packageName}`}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Status Column */}
      <div className="flex items-center w-24 shrink-0">
        <div
          onClick={(e) => {
            e.stopPropagation()
            onToggleEnabled(pkg.packageName)
          }}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider transition-all duration-150 cursor-pointer select-none active:scale-95',
            pkg.isEnabled
              ? 'bg-success/15 text-success border-success/30 hover:bg-success/20'
              : 'bg-destructive/10 text-destructive border-destructive/25 hover:bg-destructive/15'
          )}
          title="Click to toggle status"
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full shrink-0',
              pkg.isEnabled ? 'bg-success animate-pulse' : 'bg-destructive'
            )}
          />
          {pkg.isEnabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      {/* Package Column */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-mono truncate block text-foreground">
          {pkg.packageName}
        </span>
        {versionLabel && (
          <span className="text-[10px] text-muted-foreground/60 tabular block mt-0.5">
            v{versionLabel}
          </span>
        )}
      </div>

      {/* Size Column */}
      <div className="w-24 shrink-0 text-right font-mono">
        <span className="text-[11px] text-muted-foreground tabular">{sizeLabel}</span>
      </div>

      {/* Actions Column */}
      <div className="flex items-center gap-1.5 w-20 shrink-0 justify-end">
        {pkg.isSystemApp && (
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 border border-border/50 rounded px-1.5 py-0.5 font-semibold">
            sys
          </span>
        )}

        <div onClick={(e) => e.stopPropagation()}>
          <PackageActions
            packageName={pkg.packageName}
            isEnabled={pkg.isEnabled}
            isBusy={isBusy}
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
    </div>
  )
}
