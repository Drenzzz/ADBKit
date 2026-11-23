import { useState } from 'react'
import { motion } from 'motion/react'
import {
  IconCheck as Check
} from "@tabler/icons-react"
import { Button } from '@astryxdesign/core/Button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { completeSetup } from '@/services/binaryService'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { BinaryInfo } from '@/lib/types'

function versionOf(raw?: string): string | null {
  if (!raw) return null
  const withoutUrl = raw.replace(/<[^>]*>/g, '').trim()
  const match = withoutUrl.match(/\d+(?:\.\d+)*[^\s]*/)
  return match ? match[0] : withoutUrl
}

function BinarySummaryRow({ label, info }: { label: string; info?: BinaryInfo }) {
  const version = versionOf(info?.version)
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[16px] font-medium text-foreground">{label}</span>
        <span className="truncate font-mono text-[13px] text-muted-foreground">
          {info?.path ?? 'not configured'}
        </span>
      </div>
      <span className="inline-flex items-center gap-2 font-mono text-[13px] text-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
        {version ?? 'ready'}
      </span>
    </div>
  )
}

export function SummaryStep({ onComplete }: { onComplete?: () => void }) {
  const { setupState, prevStep, setSetupState, setError } = useSetupWizardStore()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const reduced = useReducedMotion()

  const handleFinish = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const state = await completeSetup()
      setSetupState(state)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Setup failed')
    } finally {
      setSubmitting(false)
    }
  }

  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }

  if (done) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 text-center"
        aria-live="polite"
      >
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={reduced ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 26 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-success/35 bg-success/10 text-success">
            <Check className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">You are ready</h1>
            <p className="max-w-md text-[16px] leading-7 text-muted-foreground">
              The local toolchain is configured. Launch ADBKit to start managing connected devices.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { delay: 0.18, duration: 0.3 }}
        >
          <Button variant="primary" onClick={onComplete} size="md" className="h-11 px-7 text-[16px]" label="Launch ADBKit" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <motion.header
        className="flex flex-col gap-1.5"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Finish setup</h1>
        <p className="max-w-xl text-[16px] leading-7 text-muted-foreground">
          Review the resolved paths, then write the configuration locally.
        </p>
      </motion.header>

      <motion.div
        className="mt-8 flex flex-col rounded-xl border border-border bg-background px-5 py-2"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.32, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
      >
        <BinarySummaryRow label="ADB" info={setupState?.status?.adb} />
        <BinarySummaryRow label="Fastboot" info={setupState?.status?.fastboot} />
        <BinarySummaryRow label="Scrcpy" info={setupState?.status?.scrcpy} />
      </motion.div>

      <footer className="mt-auto flex items-center justify-between gap-3 pt-6">
        <Button variant="ghost" size="md" onClick={prevStep} isDisabled={submitting} className="h-11" label="Back" />
        <Button
          variant="primary"
          onClick={handleFinish}
          isDisabled={submitting || !setupState?.canFinish}
          size="md"
          className="h-11 px-7 text-[16px]"
          label={submitting ? 'Writing config…' : 'Finish setup'}
        />
      </footer>
    </div>
  )
}
