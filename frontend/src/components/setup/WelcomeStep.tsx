import { Button } from '@/components/ui/button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'

export function WelcomeStep() {
  const nextStep = useSetupWizardStore((s) => s.nextStep)

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to ADBKit</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          ADB, Fastboot, and scrcpy are all required for ADBKit to function. The wizard will walk you through detecting or installing each one.
        </p>
      </div>
      <Button onClick={nextStep} size="lg">
        Get started
      </Button>
    </div>
  )
}
