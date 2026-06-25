import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { Monitor, Smartphone, Terminal } from 'lucide-react'

function detectOS(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac')) return 'macOS'
  return 'Unknown OS'
}

const REQUIRED_BINARIES = [
  { name: 'ADB', description: 'Android Debug Bridge — device detection and shell', icon: Terminal },
  { name: 'Fastboot', description: 'Bootloader operations — flashing and wipe', icon: Smartphone },
  { name: 'scrcpy', description: 'Screen mirroring, recording, clipboard sync', icon: Monitor },
]

export function WelcomeStep() {
  const nextStep = useSetupWizardStore((s) => s.nextStep)
  const osName = detectOS()

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to ADBKit</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          ADB, Fastboot, and scrcpy are all required for ADBKit to function. The wizard will walk you through detecting or installing each one.
        </p>
      </div>

      <div className="w-full max-w-xs text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
          What you'll need
        </p>
        <div className="flex flex-col gap-2">
          {REQUIRED_BINARIES.map(({ name, description, icon: Icon }) => (
            <div
              key={name}
              className="flex items-start gap-3 rounded-md border border-border/40 px-3 py-2"
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{name}</span>
                  <Badge variant="destructive" className="text-[9px] uppercase tracking-wider">
                    Required
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground/60">{description}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground/50">
          Detected platform: {osName} — binaries will be matched automatically when available.
        </p>
      </div>

      <Button onClick={nextStep} size="lg">
        Get started
      </Button>
    </div>
  )
}
