import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { getSetupState } from '@/services/binaryService'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Monitor, Smartphone, Terminal } from 'lucide-react'

function detectOS(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac')) return 'macOS'
  return 'Unknown OS'
}

const REQUIRED_BINARIES = [
  { name: 'ADB', description: 'Device detection and shell access', icon: Terminal },
  { name: 'Fastboot', description: 'Bootloader operations and flashing', icon: Smartphone },
  { name: 'scrcpy', description: 'Screen mirroring and clipboard sync', icon: Monitor },
]

export function WelcomeStep() {
  const { nextStep, setSetupState } = useSetupWizardStore()
  const osName = detectOS()
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const transition = reduced
    ? 'none'
    : 'opacity 320ms cubic-bezier(0.32, 0.72, 0, 1), transform 320ms cubic-bezier(0.32, 0.72, 0, 1)'

  return (
    <div className="flex w-full flex-col gap-8 text-left">
      <header
        className="flex flex-col gap-3"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)',
          transition,
        }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="ADBKit" className="h-12 w-12 object-contain" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-foreground">Welcome to ADBKit.</span>
            <span className="text-xs text-muted-foreground">One quick pass to connect the local Android tools ADBKit uses every day.</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {REQUIRED_BINARIES.map(({ name, description, icon: Icon }, i) => (
          <div
            key={name}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(8px)',
              transition: `${transition} ${80 + i * 60}ms`,
            }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{description}</span>
            </div>
          </div>
        ))}
      </div>

      <footer
        className="flex flex-col gap-3 border-t border-border/30 pt-5 sm:flex-row sm:items-center sm:justify-between"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)',
          transition: `${transition} 220ms`,
        }}
      >
        <span className="text-xs text-muted-foreground">
          Host detected: <span className="text-foreground">{osName}</span>
        </span>
        <Button onClick={nextStep} size="sm" className="h-8 self-end gap-1.5 px-4 sm:self-auto">
          Continue
        </Button>
      </footer>
    </div>
  )
}