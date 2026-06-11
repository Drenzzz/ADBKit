import { cn } from '@/lib/utils'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { WelcomeStep } from './WelcomeStep'
import { PlatformToolsStep } from './PlatformToolsStep'
import { ScrcpyStep } from './ScrcpyStep'
import { SummaryStep } from './SummaryStep'
import type { SetupWizardStep } from '@/lib/types'

const STEPS: { key: SetupWizardStep; label: string }[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'platform-tools', label: 'Platform Tools' },
  { key: 'scrcpy', label: 'Scrcpy' },
  { key: 'summary', label: 'Summary' },
]

function StepIndicator({ current }: { current: SetupWizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const active = i === currentIdx
        const done = i < currentIdx
        return (
          <div key={step.key} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'h-1.5 w-6 rounded-full transition-all',
                active ? 'bg-foreground' : done ? 'bg-foreground/60' : 'bg-border',
              )}
            />
            <span
              className={cn(
                'text-[9px] uppercase tracking-wider transition-colors select-none',
                active
                  ? 'text-foreground font-semibold'
                  : done
                    ? 'text-foreground/50 font-medium'
                    : 'text-muted-foreground/40',
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function StepContent({ step }: { step: SetupWizardStep }) {
  switch (step) {
    case 'welcome':
      return <WelcomeStep />
    case 'platform-tools':
      return <PlatformToolsStep />
    case 'scrcpy':
      return <ScrcpyStep />
    case 'summary':
      return <SummaryStep />
  }
}

export function SetupWizard() {
  const currentStep = useSetupWizardStore((s) => s.currentStep)

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-card p-6">
        <div className="mb-6 flex justify-center">
          <StepIndicator current={currentStep} />
        </div>
        <StepContent step={currentStep} />
      </div>
    </div>
  )
}
