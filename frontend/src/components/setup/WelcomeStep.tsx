import { Button } from '@/components/ui/button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'

export function WelcomeStep() {
  const nextStep = useSetupWizardStore((s) => s.nextStep)

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to ADBKit</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          ADBKit needs ADB, Fastboot, and scrcpy to work. Let's set them up.
        </p>
      </div>
      <Button onClick={nextStep} size="lg">
        Get started
      </Button>
    </div>
  )
}
