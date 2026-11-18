import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { WelcomeStep } from './WelcomeStep'
import { BinarySetupStep } from './BinarySetupStep'
import { SummaryStep } from './SummaryStep'
import type { SetupWizardStep } from '@/lib/types'

const STEP_ORDER: SetupWizardStep[] = ['welcome', 'setup-binary', 'finish']

const STEP_LABELS: Record<SetupWizardStep, string> = {
  welcome: 'Welcome',
  'setup-binary': 'Setup binary',
  finish: 'Finish',
}

function ProgressStepper({ current }: { current: SetupWizardStep }) {
  const currentIdx = STEP_ORDER.indexOf(current)
  const reduced = useReducedMotion()

  return (
    <ol className="flex items-center gap-2" aria-label="Setup progress">
      {STEP_ORDER.map((step, i) => {
        const active = i === currentIdx
        const done = i < currentIdx
        return (
          <li key={step} className="flex items-center gap-2">
            {i > 0 && (
              <span
                className={cn(
                  'h-px w-5 transition-colors duration-300',
                  done || active ? 'bg-primary/40' : 'bg-border',
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                'relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[14px] transition-colors duration-300',
                active
                  ? 'font-medium text-foreground'
                  : done
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/60',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {active && !reduced && (
                <motion.span
                  layoutId="setup-step-surface"
                  className="absolute inset-0 -z-10 rounded-full bg-primary/10"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[14px] font-medium',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : done
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              {STEP_LABELS[step]}
            </span>
          </li>
        )
      })}
    </ol>
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
  const reduced = useReducedMotion()
  const [direction, setDirection] = useState(1)
  const [prevStepKey, setPrevStepKey] = useState<SetupWizardStep | null>(null)

  useEffect(() => {
    const idx = STEP_ORDER.indexOf(currentStep)
    const prevIdx = prevStepKey ? STEP_ORDER.indexOf(prevStepKey) : idx
    if (idx !== prevIdx) setDirection(idx > prevIdx ? 1 : -1)
    setPrevStepKey(currentStep)
  }, [currentStep, prevStepKey])

  const variants = {
    enter: (dir: number) => (reduced ? { opacity: 0 } : { opacity: 0, x: dir * 32 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => (reduced ? { opacity: 0 } : { opacity: 0, x: dir * -32 }),
  }

  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center bg-background p-4 text-foreground sm:p-6">
      <div className="flex max-h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-floating)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-8 py-5">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="" className="h-9 w-9 object-contain" />
            <div className="flex flex-col">
              <span className="text-[16px] font-semibold leading-tight text-foreground">ADBKit</span>
              <span className="text-[14px] leading-tight text-muted-foreground">Setup</span>
            </div>
          </div>
          <ProgressStepper current={currentStep} />
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-8 sm:px-12">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col justify-center"
            >
              <StepContent step={currentStep} onComplete={onComplete} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
