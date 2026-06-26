import { motion } from 'motion/react'
import { useSettings } from '@/hooks/useSettings'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Skeleton } from '@/components/ui/skeleton'
import { BinaryManager } from './BinaryManager'
import { PreferencesPanel } from './PreferencesPanel'
import { AuditLogsPanel } from './AuditLogsPanel'
import { DiagnosticsPanel } from './DiagnosticsPanel'

export function SettingsShell() {
  const reduced = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduced
        ? { duration: 0, staggerChildren: 0 }
        : { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 260, damping: 22 },
    },
  }

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
  } = useSettings()

  if (loadingConfig && !appConfig) {
    return (
      <div className="flex h-full flex-col gap-4 p-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full animate-pulse" />
        <Skeleton className="h-32 w-full animate-pulse" />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-0.5 shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground font-medium">
          Manage system binaries, visual preferences, runtime diagnostics, and system operation logs.
        </p>
      </motion.div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6 min-h-0">
        
        {/* Box 1: Binaries (Takes 2/3 width) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col min-w-0">
          <BinaryManager />
        </motion.div>

        {/* Box 2: Preferences (Takes 1/3 width) */}
        <motion.div variants={itemVariants} className="lg:col-span-1 flex flex-col min-w-0">
          <PreferencesPanel
            preferencesDraft={preferencesDraft}
            saving={savingPreferences}
            hasChanges={hasPreferenceChanges}
            errorMessage={error}
            onDraftChange={setPreferencesDraft}
            onSave={() => void savePreferences()}
            onReset={resetPreferencesDraft}
          />
        </motion.div>

        {/* Box 3: Audit Logs (Full Width) */}
        <motion.div variants={itemVariants} className="lg:col-span-3 flex flex-col min-w-0">
          <AuditLogsPanel />
        </motion.div>

        {/* Box 4: Diagnostics (Full Width at the very bottom) */}
        <motion.div variants={itemVariants} className="lg:col-span-3 flex flex-col min-w-0">
          <DiagnosticsPanel />
        </motion.div>
      </div>
    </motion.div>
  )
}
