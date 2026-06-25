import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all text-base">{packageName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : details ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">
                {details.versionName || 'N/A'}
                {details.versionCode && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {details.versionCode}
                  </Badge>
                )}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">APK Size</span>
              <span className="font-medium">{formatBytes(details.apkSizeBytes)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Data Size</span>
              <span className="font-medium">{formatBytes(details.dataSizeBytes)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Size</span>
              <span className="font-medium">{formatBytes(details.totalSizeBytes)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Failed to load package details.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
