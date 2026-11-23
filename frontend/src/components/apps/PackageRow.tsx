import { useEffect } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes < 0) return ''
  if (bytes === 0) return '0 B'
  const kb = 1024
  if (bytes >= kb * kb * kb) return `${(bytes / (kb * kb * kb)).toFixed(1)} GB`
  if (bytes >= kb * kb) return `${(bytes / (kb * kb)).toFixed(1)} MB`
  return `${(bytes / kb).toFixed(0)} KB`
}

interface PackageRowProps {
  pkg: {
    packageName: string
    isEnabled: boolean
    isSystemApp?: boolean
  }
  details?: { totalSizeBytes?: number; versionName?: string }
  loadDetails: (name: string) => void
  onToggleSelect: (name: string) => void
}

export function PackageRow({
  pkg,
  details,
  loadDetails,
  onToggleSelect,
}: PackageRowProps) {
  const reduced = useReducedMotion()
  const versionLabel = details?.versionName

  useEffect(() => {
    loadDetails(pkg.packageName)
  }, [pkg.packageName, loadDetails])

  return (
    <div
      className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-4 pl-6"
      onClick={() => onToggleSelect(pkg.packageName)}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]">
          {pkg.packageName}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[14px]">
          <span className="tabular text-[var(--color-text-secondary)]">
            {versionLabel ?? '…'}
          </span>
          <motion.span
            initial={reduced ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[14px] font-semibold',
              pkg.isEnabled
                ? 'bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]'
                : 'bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)]',
            )}
          >
            {pkg.isEnabled ? 'Enabled' : 'Disabled'}
          </motion.span>
          {pkg.isSystemApp && (
            <span className="rounded-full bg-[var(--color-background-muted)] px-2.5 py-0.5 text-[14px] font-medium text-[var(--color-text-secondary)]">
              System
            </span>
          )}
        </div>
      </div>

      <span
        className={cn(
          'shrink-0 pr-1 text-[14px] tabular transition-colors duration-200',
          details ? 'text-[var(--color-text-primary)]' : 'text-transparent',
        )}
      >
        {details ? formatSize(details.totalSizeBytes) : '0 MB'}
      </span>
    </div>
  )
}
