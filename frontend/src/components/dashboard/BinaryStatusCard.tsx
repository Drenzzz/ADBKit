import { useEffect, useState, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBinaryStatus } from '@/services/binaryService'
import type { BinaryInfo, BinarySetupResult } from '@/lib/types'

function BinaryRow({ label, info }: { label: string; info: BinaryInfo }) {
  const ready = info.status === 'ready'
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2">
        {ready
          ? <Check className="h-3.5 w-3.5 text-green-500" />
          : <X className="h-3.5 w-3.5 text-destructive" />
        }
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Badge variant={ready ? 'default' : 'secondary'} className="text-[10px]">
        {ready ? info.version ?? 'ready' : info.status}
      </Badge>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function BinaryStatusCard() {
  const [status, setStatus] = useState<BinarySetupResult | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getBinaryStatus()
      setStatus(result)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Binary Status</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : !status ? (
          <p className="text-sm text-muted-foreground">Failed to load binary status.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <BinaryRow label="ADB" info={status.adb} />
            <BinaryRow label="Fastboot" info={status.fastboot} />
            <BinaryRow label="Scrcpy" info={status.scrcpy} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
