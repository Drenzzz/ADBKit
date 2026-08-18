import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { WelcomeStep } from './WelcomeStep'
import { BinarySetupStep } from './BinarySetupStep'
import { SummaryStep } from './SummaryStep'
import type { SetupWizardStep } from '@/lib/types'
import { CheckCircle2, HelpCircle, Terminal, type LucideIcon } from 'lucide-react'

const STEPS: { key: SetupWizardStep; label: string; icon: LucideIcon }[] = [
  { key: 'welcome', label: 'Welcome', icon: HelpCircle },
  { key: 'setup-binary', label: 'Setup binary', icon: Terminal },
  { key: 'finish', label: 'Finish', icon: CheckCircle2 },
]

function SidebarStepper({ current }: { current: SetupWizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex items-center gap-3 px-1"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(6px)',
          transition: reduced
            ? 'none'
            : 'opacity 320ms cubic-bezier(0.32, 0.72, 0, 1), transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <img src="/logo.webp" alt="ADBKit" className="h-8 w-8 object-contain" />
        <div className="flex flex-col">
          <span className="select-none text-sm font-semibold tracking-tight text-foreground">
            ADBKit
          </span>
          <span className="select-none text-xs text-muted-foreground">Setup</span>
        </div>
      </div>

      <nav className="relative flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        {STEPS.map((step, i) => {
          const active = i === currentIdx
          const done = i < currentIdx
          const Icon = step.icon

          return (
            <div
              key={step.key}
              className={cn(
                'relative flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 select-none transition-colors duration-200 lg:flex-none lg:px-1.5',
                active
                  ? 'text-foreground'
                  : done
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/55',
              )}
              aria-current={active ? 'step' : undefined}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(6px)',
                transition: reduced
                  ? 'none'
                  : `opacity 320ms cubic-bezier(0.32, 0.72, 0, 1) ${80 + i * 60}ms, transform 320ms cubic-bezier(0.32, 0.72, 0, 1) ${80 + i * 60}ms`,
              }}
            >
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : done
                      ? 'border-foreground/40 text-foreground/70'
                      : 'border-border text-muted-foreground/55',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-sm transition-colors duration-200 lg:whitespace-normal',
                  active ? 'font-medium' : 'font-normal',
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </nav>
    </div>
  )
}

function StepContent({ step, onComplete }: { step: SetupWizardStep; onComplete?: () => void }) {
  switch (step) {
    case 'welcome':
      return <WelcomeStep />
    case 'setup-binary':
      return <BinarySetupStep />
    case 'finish':
      return <SummaryStep onComplete={onComplete} />
  }
}

export function SetupWizard({ onComplete }: { onComplete?: () => void }) {
  const currentStep = useSetupWizardStore((s) => s.currentStep)

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="grid min-h-[min(640px,calc(100dvh-3rem))] w-full max-w-5xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-floating)] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex flex-col justify-between border-b border-border/50 p-5 lg:border-b-0 lg:border-r">
          <SidebarStepper current={currentStep} />
        </aside>

        <main className="min-w-0 overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center">
            <StepContent step={currentStep} onComplete={onComplete} />
          </div>
        </main>
      </div>
    </div>
  )
}