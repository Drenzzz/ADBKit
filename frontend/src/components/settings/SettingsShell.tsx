import { motion } from 'motion/react'
import { Heading } from '@astryxdesign/core/Heading'
import { useSettings } from '@/hooks/useSettings'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { BinaryManager } from './BinaryManager'
import { PreferencesPanel } from './PreferencesPanel'
import { AuditLogsPanel } from './AuditLogsPanel'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function SettingsShell() {
  const reduced = useReducedMotion()

  const enter = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.12 : 0.35, delay: reduced ? 0 : delay, ease: EASE },
  })

  const {
    appConfig,
    preferencesDraft,
    loadingConfig,
    savingPreferences,
    error,
    hasPreferenceChanges,
    setPreferencesDraft,
    savePreferences,
    resetPreferencesDraft,
    windowState,
    setPreferredWindowState,
    savingWindowState,
  } = useSettings()

  if (loadingConfig && !appConfig) {
    return (
      <div className="dashboard-scale flex h-full flex-col gap-4 p-5">
        <Skeleton height={40} width={192} radius={2} />
        <Skeleton height={256} width="100%" radius={4} />
        <Skeleton height={160} width="100%" radius={4} />
      </div>
    )
  }

  return (
    <div className="dashboard-scale relative flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-5">
      <motion.header {...enter(0)}>
        <Heading level={1} type="display-1" weight="semibold" maxLines={1}>
          Settings
        </Heading>
      </motion.header>

      <motion.div {...enter(0.05)}>
        <PreferencesPanel
          preferencesDraft={preferencesDraft}
          saving={savingPreferences}
          hasChanges={hasPreferenceChanges}
          errorMessage={error}
          onDraftChange={setPreferencesDraft}
          onSave={() => void savePreferences()}
          onReset={resetPreferencesDraft}
          windowState={windowState}
          savingWindowState={savingWindowState}
          onWindowStateChange={(state) => void setPreferredWindowState(state)}
        />
      </motion.div>

      <motion.div {...enter(0.1)}>
        <BinaryManager />
      </motion.div>

      <motion.div {...enter(0.2)}>
        <AuditLogsPanel />
      </motion.div>
    </div>
  )
}