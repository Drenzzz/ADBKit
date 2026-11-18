import { useState } from 'react'
import {
  IconArrowLeft as ArrowLeft,
  IconArrowRight as ArrowRight,
  IconCircleCheck as CheckCircle2,
  IconSearch as Search
} from "@tabler/icons-react"
import { Button } from '@/components/ui/button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { getSetupState } from '@/services/binaryService'
import { PlatformToolsStep } from './PlatformToolsStep'
import { ScrcpyStep } from './ScrcpyStep'

export function BinarySetupStep() {
  const { setupState, loading, prevStep, nextStep, setSetupState, setLoading, setError } =
    useSetupWizardStore()
  const ready = Boolean(setupState?.canFinish)
  const [scanning, setScanning] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    setLoading(true)
    setError(null)
    try {
      const state = await getSetupState()
      setSetupState(state)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
      setScanning(false)
    }
  }

  const busy = loading || scanning

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Set up the binaries
          </h1>
          <p className="max-w-xl text-[16px] leading-7 text-muted-foreground">
            Scan the host first, then link or download each tool.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleScan}
          disabled={busy}
          className="h-9 shrink-0 gap-2 px-3 text-[14px]"
        >
          <Search className="h-4 w-4" />
          {busy ? 'Scanning' : 'Rescan'}
        </Button>
      </header>

      <div className="mt-7 flex flex-col gap-6">
        <PlatformToolsStep embedded />
        <ScrcpyStep embedded autoScan={false} />
      </div>

      <footer className="mt-auto flex flex-col gap-6 pt-6">
        <div className="flex items-center gap-2.5 text-[14px] text-muted-foreground">
          {ready ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden />
          )}
          <span>
            {ready
              ? 'All binaries detected. Continue to finish setup.'
              : 'Awaiting ADB, Fastboot, and Scrcpy.'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="lg" onClick={prevStep} disabled={busy} className="h-11 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={!ready || busy}
            size="lg"
            className="h-11 gap-2 px-7 text-[16px]"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
