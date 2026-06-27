import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { getSetupState } from '@/services/binaryService'
import { Monitor, Smartphone, Terminal } from 'lucide-react'

function detectOS(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac')) return 'macOS'
  return 'Unknown OS'
}

const REQUIRED_BINARIES = [
  { name: 'ADB', description: 'Android Debug Bridge — device detection & shell', icon: Terminal },
  { name: 'Fastboot', description: 'Bootloader operations — flashing & wipe', icon: Smartphone },
  { name: 'scrcpy', description: 'Screen mirroring & clipboard sync', icon: Monitor },
]

export function WelcomeStep() {
  const { nextStep, setSetupState } = useSetupWizardStore()
  const osName = detectOS()

  // Pre-fetch setup state silently on mount
  useEffect(() => {
    let active = true
    const silentScan = async () => {
      try {
        const state = await getSetupState()
        if (active) {
          setSetupState(state)
        }
      } catch {
        // fail silently
      }
    }
    void silentScan()
    return () => {
      active = false
    }
  }, [setSetupState])

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome to ADBKit
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
          ADBKit requires Android Debug Bridge (ADB), Fastboot, and Scrcpy. This assistant will help you verify or install these tools to configure your environment.
        </p>
      </div>

      <div className="w-full">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
          Required Components
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {REQUIRED_BINARIES.map(({ name, description, icon: Icon }) => (
            <div
              key={name}
              className="flex items-center gap-3.5 rounded-xl border border-border/50 bg-muted/5 px-4 py-3"
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/20">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{name}</span>
                  <Badge variant="outline" className="text-[8px] uppercase tracking-wider border-primary/20 text-primary bg-primary/5 px-1 py-0 select-none">
                    Required
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground/75 truncate mt-0.5">{description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/10 pt-5 mt-2">
        <span className="text-[10px] text-muted-foreground/50">
          Detected Platform: <span className="font-semibold text-muted-foreground/70">{osName}</span>
        </span>
        <Button onClick={nextStep} size="sm" className="px-5">
          Get Started
        </Button>
      </div>
    </div>
  )
}
