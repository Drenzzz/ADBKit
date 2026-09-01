import { useEffect, useState } from 'react'
import {
  IconCheck as Check
} from "@tabler/icons-react"
import { Button } from '@/components/ui/button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { completeSetup } from '@/services/binaryService'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { BinaryInfo } from '@/lib/types'

function BinarySummaryRow({ label, info }: { label: string; info?: BinaryInfo }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          {info?.version ?? 'ready'}
        </span>
      </div>
      <div className="truncate text-xs text-muted-foreground">
        {info?.path ?? 'not configured'}
      </div>
    </div>
  )
}

export function SummaryStep({ onComplete }: { onComplete?: () => void }) {
  const { setupState, prevStep, setSetupState, setError } = useSetupWizardStore()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFinish = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const state = await completeSetup()
      setSetupState(state)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Setup failed')
    } finally {
      setSubmitting(false)
    }
  }

  const transition = reduced
    ? 'none'
    : 'opacity 320ms cubic-bezier(0.32, 0.72, 0, 1), transform 320ms cubic-bezier(0.32, 0.72, 0, 1)'

  if (done) {
    return (
      <div
        className="flex w-full flex-col gap-5 text-left"
        aria-live="polite"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)',
          transition,
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <Check className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">You are ready.</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            The local toolchain is configured. Launch ADBKit to start managing connected devices.
          </p>
        </div>

        <div className="flex justify-end border-t border-border/30 pt-5">
          <Button onClick={onComplete} size="sm" className="h-8 px-5">
            Launch ADBKit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex w-full flex-col gap-6 text-left"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transition,
      }}
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.6rem]">Finish setup.</h1>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          Review the resolved paths, then write the configuration locally.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background p-5">
        <div className="border-b border-border/30 pb-2 text-xs text-muted-foreground">
          Local Environment
        </div>
        <div className="flex flex-col divide-y divide-border/30">
          <BinarySummaryRow label="ADB" info={setupState?.status?.adb} />
          <BinarySummaryRow label="Fastboot" info={setupState?.status?.fastboot} />
          <BinarySummaryRow label="Scrcpy" info={setupState?.status?.scrcpy} />
        </div>
      </div>

      <footer className="flex items-center justify-between border-t border-border/30 pt-5">
        <Button variant="ghost" size="sm" onClick={prevStep} disabled={submitting} className="h-8">
          Back
        </Button>
        <Button
          onClick={handleFinish}
          disabled={submitting || !setupState?.canFinish}
          size="sm"
          className="h-8 px-5"
        >
          {submitting ? 'Writing config...' : 'Finish Setup'}
        </Button>
      </footer>
    </div>
  )
}