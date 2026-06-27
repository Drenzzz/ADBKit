import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { completeSetup } from '@/services/binaryService'
import type { BinaryInfo } from '@/lib/types'

function BinarySummaryRow({ label, info }: { label: string; info?: BinaryInfo }) {
  return (
    <div className="flex flex-col gap-1 py-1 px-2 hover:bg-muted/10 rounded transition-colors duration-150">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-semibold text-success">{info?.version ?? 'ready'}</span>
      </div>
      <div className="text-[10px] text-muted-foreground/60 font-mono truncate select-all">
        {info?.path ?? 'not configured'}
      </div>
    </div>
  )
}

export function SummaryStep() {
  const { setupState, prevStep, setSetupState, setError } = useSetupWizardStore()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

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

  if (done) {
    return (
      <div className="flex flex-col gap-5 text-left w-full">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-success/15 flex items-center justify-center text-success">
              <Check className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Setup Complete</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
            ADBKit environment has been successfully configured. You can now access the full suite.
          </p>
        </div>

        <div className="border-t border-border/10 pt-5 mt-2 flex justify-end">
          <Button onClick={() => window.location.reload()} size="sm" className="px-5">
            Launch ADBKit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Configuration Summary</h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
          Please review the final local paths and versions of your developer tools before finalizing.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-[#0c0d10] p-4 flex flex-col gap-3 font-mono">
        <div className="text-[10px] text-muted-foreground/45 border-b border-border/15 pb-2 mb-1 uppercase tracking-wider select-none">
          Local Environment Diagnostics
        </div>
        <div className="flex flex-col gap-2.5 divide-y divide-border/10">
          <BinarySummaryRow label="ADB" info={setupState?.status?.adb} />
          <div className="pt-2">
            <BinarySummaryRow label="Fastboot" info={setupState?.status?.fastboot} />
          </div>
          <div className="pt-2">
            <BinarySummaryRow label="Scrcpy" info={setupState?.status?.scrcpy} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/10 pt-4 mt-2">
        <Button variant="ghost" size="sm" onClick={prevStep} disabled={submitting} className="h-8">
          Back
        </Button>
        <Button
          onClick={handleFinish}
          disabled={submitting || !setupState?.canFinish}
          size="sm"
          className="px-5 h-8 font-medium"
        >
          {submitting ? 'Writing Config...' : 'Finish Setup'}
        </Button>
      </div>
    </div>
  )
}
