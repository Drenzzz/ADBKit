import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { PackageDetails } from '@/lib/types'

interface PackageDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageName: string
  onFetchDetails: (name: string) => Promise<PackageDetails | null>
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-[15px] text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-[18px] font-semibold tracking-tight tabular text-[var(--color-text-primary)]">
        {value}
      </span>
    </div>
  )
}

export function PackageDetailSheet({
  open,
  onOpenChange,
  packageName,
  onFetchDetails,
}: PackageDetailSheetProps) {
  const [details, setDetails] = useState<PackageDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !packageName) {
      setDetails(null)
      return
    }
    let cancelled = false
    setLoading(true)
    onFetchDetails(packageName).then((result) => {
      if (!cancelled) {
        setDetails(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, packageName])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] gap-0 rounded-2xl border border-border/50 bg-card/60 p-0 backdrop-blur-2xl supports-backdrop-filter:bg-card/70">
        <div className="dashboard-scale">
          <DialogHeader className="border-b border-border/40 px-7 py-6">
            <DialogTitle className="break-all text-[24px] font-bold leading-tight tracking-tight text-[var(--color-text-primary)]">
              {packageName}
            </DialogTitle>
          </DialogHeader>

          <div className="px-7 py-3">
            {loading ? (
              <div className="space-y-5 py-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : details ? (
              <div className="divide-y divide-border/40">
                <StatRow label="Version" value={details.versionName || 'N/A'} />
                {details.versionCode && (
                  <StatRow label="Version code" value={details.versionCode} />
                )}
                <StatRow label="APK size" value={formatBytes(details.apkSizeBytes)} />
                <StatRow label="Data size" value={formatBytes(details.dataSizeBytes)} />
                <StatRow label="Total size" value={formatBytes(details.totalSizeBytes)} />
              </div>
            ) : (
              <p className="py-4 text-[15px] text-[var(--color-text-secondary)]">
                Failed to load package details.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
