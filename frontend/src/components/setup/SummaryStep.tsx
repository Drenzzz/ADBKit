import { useState } from 'react'
import { Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { completeSetup } from '@/services/binaryService'
import type { BinaryInfo } from '@/lib/types'

function BinarySummary({ label, info }: { label: string; info?: BinaryInfo }) {
  const ready = info?.status === 'ready'
  return (
    <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
      <div className="flex items-center gap-2">
        {ready && <Check className="h-3.5 w-3.5 text-green-500" />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Badge variant={ready ? 'default' : 'destructive'} className="text-[10px]">
        {ready ? info?.version ?? 'ready' : 'not found'}
      </Badge>
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
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
          <Check className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Setup complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ADBKit is ready to use.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>Continue to ADBKit</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All required binaries are configured.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <BinarySummary label="ADB" info={setupState?.status?.adb} />
        <BinarySummary label="Fastboot" info={setupState?.status?.fastboot} />
        <BinarySummary label="Scrcpy" info={setupState?.status?.scrcpy} />
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep} disabled={submitting}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleFinish} disabled={submitting || !setupState?.canFinish}>
          {submitting ? 'Finishing...' : 'Finish setup'}
        </Button>
      </div>
    </div>
  )
}
