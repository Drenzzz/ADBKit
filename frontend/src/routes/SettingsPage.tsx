import { BinaryManagerPanel } from '@/components/settings/BinaryManagerPanel'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Binary manager, preferences, and diagnostics.
        </p>
      </div>
      <BinaryManagerPanel />
    </div>
  )
}
