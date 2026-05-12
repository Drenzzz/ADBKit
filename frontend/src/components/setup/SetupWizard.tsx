import { cn } from '@/lib/utils'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { WelcomeStep } from './WelcomeStep'
import { PlatformToolsStep } from './PlatformToolsStep'
import { ScrcpyStep } from './ScrcpyStep'
import { SummaryStep } from './SummaryStep'
import type { SetupWizardStep } from '@/lib/types'

const STEP_META: Record<SetupWizardStep, { label: string; index: number }> = {
  welcome: { label: 'Welcome', index: 0 },
  'platform-tools': { label: 'Platform Tools', index: 1 },
  scrcpy: { label: 'Scrcpy', index: 2 },
  summary: { label: 'Summary', index: 3 },
}

function StepIndicator({ current }: { current: SetupWizardStep }) {
  const currentIdx = STEP_META[current].index

  return (
    <div className="flex items-center gap-1.5">
      {(['welcome', 'platform-tools', 'scrcpy', 'summary'] as const).map((step, i) => {
        const active = i === currentIdx
        const done = i < currentIdx
        return (
          <div
            key={step}
            className={cn(
              'h-1.5 rounded-full transition-all',
              active ? 'w-6 bg-foreground' : done ? 'w-1.5 bg-foreground/60' : 'w-1.5 bg-border',
            )}
          />
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
