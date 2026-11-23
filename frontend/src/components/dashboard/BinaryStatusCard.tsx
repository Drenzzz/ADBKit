import { useEffect, useState, useCallback } from 'react'
import {
  IconCircleCheck as CheckCircle2,
  IconAlertTriangle as AlertTriangle,
  IconShieldCheck as ShieldCheck,
  IconTerminal as Terminal,
  IconCpu as Cpu
} from "@tabler/icons-react"
import { getBinaryStatus } from '@/services/binaryService'
import type { BinaryInfo, BinarySetupResult } from '@/lib/types'
import { Skeleton } from '@astryxdesign/core/Skeleton'

function BinaryRow({ label, icon, info }: { label: string; icon: React.ReactNode; info: BinaryInfo }) {
  const ready = info.status === 'ready'
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-[14px] font-semibold text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-mono text-muted-foreground max-w-[150px] truncate">
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
    <section className="m3-surface rounded-3xl p-5 border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <h3 className="mb-4 flex items-center gap-2.5 text-[18px] font-semibold text-[var(--color-text-primary)]">
        <span className="text-[var(--color-text-secondary)]"><ShieldCheck className="h-3.5 w-3.5" /></span>
        Binary Diagnostics
      </h3>
      {loading ? (
        <div className="space-y-3 py-2">
          <Skeleton height={20} width="100%" radius={2} />
          <Skeleton height={20} width="100%" radius={2} />
          <Skeleton height={20} width="100%" radius={2} />
        </div>
      ) : !status ? (
        <p className="text-[14px] text-muted-foreground py-2 text-center">Failed to load diagnostics.</p>
      ) : (
        <div className="divide-y divide-border/40">
          <BinaryRow label="ADB Tool" icon={<Terminal className="h-3.5 w-3.5" />} info={status.adb} />
          <BinaryRow label="Fastboot Flasher" icon={<Cpu className="h-3.5 w-3.5" />} info={status.fastboot} />
          <BinaryRow label="Scrcpy Engine" icon={<Cpu className="h-3.5 w-3.5" />} info={status.scrcpy} />
        </div>
      )}
    </section>
  )
}
