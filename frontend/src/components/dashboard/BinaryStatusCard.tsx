import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, ShieldCheck, Terminal, Cpu } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBinaryStatus } from '@/services/binaryService'
import type { BinaryInfo, BinarySetupResult } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

function BinaryRow({ label, icon, info }: { label: string; icon: React.ReactNode; info: BinaryInfo }) {
  const ready = info.status === 'ready'
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-muted-foreground max-w-[150px] truncate">
          {ready ? info.version ?? 'Ready' : info.status}
        </span>
        {ready ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
        )}
      </div>
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
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          <ShieldCheck className="h-3.5 w-3.5" />
          Binary Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : !status ? (
          <p className="text-xs text-muted-foreground py-2 text-center">Failed to load diagnostics.</p>
        ) : (
          <div className="divide-y divide-border/40">
            <BinaryRow label="ADB Tool" icon={<Terminal className="h-3.5 w-3.5" />} info={status.adb} />
            <BinaryRow label="Fastboot Flasher" icon={<Cpu className="h-3.5 w-3.5" />} info={status.fastboot} />
            <BinaryRow label="Scrcpy Engine" icon={<Cpu className="h-3.5 w-3.5" />} info={status.scrcpy} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
