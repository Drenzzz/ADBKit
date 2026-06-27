import { cn } from '@/lib/utils'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { WelcomeStep } from './WelcomeStep'
import { PlatformToolsStep } from './PlatformToolsStep'
import { ScrcpyStep } from './ScrcpyStep'
import { SummaryStep } from './SummaryStep'
import type { SetupWizardStep } from '@/lib/types'
import { Monitor, Terminal, HelpCircle, CheckCircle2 } from 'lucide-react'

const STEPS: { key: SetupWizardStep; label: string; icon: any }[] = [
  { key: 'welcome', label: 'Welcome', icon: HelpCircle },
  { key: 'platform-tools', label: 'Platform Tools', icon: Terminal },
  { key: 'scrcpy', label: 'Scrcpy', icon: Monitor },
  { key: 'summary', label: 'Summary', icon: CheckCircle2 },
]

function SidebarStepper({ current }: { current: SetupWizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2.5 px-2 py-4 border-b border-border/20">
        <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-white shadow-sm">
          <Terminal className="h-4.5 w-4.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground tracking-tight select-none">
            ADBKit Setup
          </span>
          <span className="text-[9px] text-muted-foreground/60 tracking-wider">
            ASSISTANT v2.0
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-2 relative">
        {/* Connector vertical line */}
        <div className="absolute left-[25px] top-[18px] bottom-[18px] w-[1px] bg-border/30" />

        {STEPS.map((step, i) => {
          const active = i === currentIdx
          const done = i < currentIdx
          const Icon = step.icon

          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition-all duration-200 select-none relative z-10',
                active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground/75',
              )}
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center border transition-all duration-200 shadow-sm',
                  active
                    ? 'border-primary bg-primary text-primary-foreground font-semibold'
                    : done
                      ? 'border-success bg-success/15 text-success'
                      : 'border-border bg-muted/40 text-muted-foreground/50',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span
                className={cn(
                  'text-xs tracking-tight transition-colors duration-200',
                  active ? 'text-foreground font-medium' : 'text-muted-foreground/70',
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

interface SetupWizardProps {
  onSkipToApp?: () => void
}

export function SetupWizard({ onSkipToApp }: SetupWizardProps) {
  const currentStep = useSetupWizardStore((s) => s.currentStep)

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0b0d]/40 p-4">
      <div className="flex w-full max-w-3xl min-h-[500px] h-[540px] rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-floating)] overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[240px] bg-muted/15 border-r border-border/40 p-5 flex flex-col justify-between shrink-0">
          <SidebarStepper current={currentStep} />
          
          <div className="px-2 py-2 border-t border-border/20 text-[10px] text-muted-foreground/45 font-mono select-none">
            OS: {navigator.userAgent.toLowerCase().includes('linux') ? 'Linux' : 'Darwin/Windows'}
          </div>
        </div>

        {/* Right Workspace */}
        <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto bg-card relative">
          <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
            <StepContent step={currentStep} />
          </div>

          {onSkipToApp && currentStep !== 'summary' && (
            <div className="mt-6 flex justify-center border-t border-border/10 pt-4">
              <button
                type="button"
                onClick={onSkipToApp}
                className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors underline underline-offset-2"
              >
                Skip configuration for now (set up binaries manually later)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
