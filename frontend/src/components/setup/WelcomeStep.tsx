import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { getSetupState } from '@/services/binaryService'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  IconDeviceDesktop as Monitor,
  IconDeviceMobile as Smartphone,
  IconTerminal as Terminal
} from "@tabler/icons-react"

function detectOS(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac')) return 'macOS'
  return 'Unknown OS'
}

const REQUIRED_BINARIES = [
  { key: 'adb', name: 'ADB', description: 'Device detection and shell access', icon: Terminal },
  { key: 'fastboot', name: 'Fastboot', description: 'Bootloader operations and flashing', icon: Smartphone },
  { key: 'scrcpy', name: 'Scrcpy', description: 'Screen mirroring and clipboard sync', icon: Monitor },
] as const

export function WelcomeStep() {
  const { nextStep, setSetupState } = useSetupWizardStore()
  const osName = detectOS()
  const reduced = useReducedMotion()

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
    <div className="flex min-h-0 flex-1 flex-col">
      <motion.div
        className="flex flex-col gap-3"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src="/logo.webp" alt="" className="h-16 w-16 object-contain" />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Welcome to ADBKit
          </h1>
          <p className="max-w-xl text-[16px] leading-7 text-muted-foreground">
            Connect the local Android tools ADBKit drives: adb, fastboot, and scrcpy.
          </p>
        </div>
      </motion.div>

      <div className="mt-8 flex flex-col gap-3">
        {REQUIRED_BINARIES.map(({ name, description, icon: Icon }, i) => (
            <motion.div
              key={name}
              className="flex items-start gap-4 rounded-xl border border-border bg-background px-5 py-4"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 0.32, delay: 0.08 + i * 0.06, ease: [0.16, 1, 0.3, 1] }
              }
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[16px] font-medium text-foreground">{name}</span>
                <p className="text-[14px] leading-6 text-muted-foreground">{description}</p>
              </div>
            </motion.div>
        ))}
      </div>

      <motion.footer
        className="mt-auto flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.32, delay: 0.28 }}
      >
        <span className="text-[14px] text-muted-foreground">
          Host detected: <span className="font-medium text-foreground">{osName}</span>
        </span>
        <Button onClick={nextStep} size="lg" className="h-11 px-7 text-[16px]">
          Continue
        </Button>
      </motion.footer>
    </div>
  )
}
