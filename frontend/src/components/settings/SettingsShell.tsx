import { useSettings } from '@/hooks/useSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { BinaryManager } from './BinaryManager'
import { PreferencesPanel } from './PreferencesPanel'
import { AuditLogsPanel } from './AuditLogsPanel'
import { DiagnosticsPanel } from './DiagnosticsPanel'
import { Binary, Settings, ScrollText, Activity } from 'lucide-react'

export function SettingsShell() {
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
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure binaries, appearance, review operation history, and inspect
          runtime diagnostics.
        </p>
      </div>

      <Tabs defaultValue="binary" className="flex flex-col gap-4">
        <TabsList className="h-9 w-fit">
          <TabsTrigger value="binary" className="gap-1.5">
            <Binary className="h-3.5 w-3.5" />
            Binaries
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Diagnostics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="binary" className="mt-0">
          <BinaryManager />
        </TabsContent>

        <TabsContent value="preferences" className="mt-0">
          <PreferencesPanel
            preferencesDraft={preferencesDraft}
            saving={savingPreferences}
            hasChanges={hasPreferenceChanges}
            errorMessage={error}
            onDraftChange={setPreferencesDraft}
            onSave={() => void savePreferences()}
            onReset={resetPreferencesDraft}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-0">
          <AuditLogsPanel />
        </TabsContent>

        <TabsContent value="diagnostics" className="mt-0">
          <DiagnosticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
