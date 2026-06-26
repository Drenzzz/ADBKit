import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, Sun, Moon, RotateCcw, Save, Settings } from 'lucide-react'
import type { PreferencesPayload } from '@/lib/types'

interface PreferencesPanelProps {
  preferencesDraft: PreferencesPayload
  saving: boolean
  hasChanges: boolean
  errorMessage: string | null
  onDraftChange: (draft: Partial<PreferencesPayload>) => void
  onSave: () => void
  onReset: () => void
}

const THEME_OPTIONS: { value: 'dark' | 'light'; label: string; description: string; Icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', description: 'Low-light UI', Icon: Moon },
  { value: 'light', label: 'Light', description: 'Bright UI', Icon: Sun },
]

const TERMINAL_MODES = [
  { value: 'adb-shell', label: 'ADB Shell' },
  { value: 'adb-host', label: 'ADB Host' },
  { value: 'fastboot-host', label: 'Fastboot Host' },
]

export function PreferencesPanel({
  preferencesDraft,
  saving,
  hasChanges,
  errorMessage,
  onDraftChange,
  onSave,
  onReset,
}: PreferencesPanelProps) {
  return (
    <Card className="border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/40 rounded-2xl shadow-[var(--shadow-card)] h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Settings className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
          Preferences
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow p-5 pt-0">
        <div className="space-y-4">
          {/* Appearance Section */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Appearance
            </span>
            <div className="inline-flex w-full items-center gap-1 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/50 dark:bg-[var(--muted)]/20 p-1">
              {THEME_OPTIONS.map(({ value, label, description, Icon }) => {
                const active = preferencesDraft.theme === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onDraftChange({ theme: value })}
                    className={cn(
                      'flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer',
                      active
                        ? 'bg-card dark:bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-[var(--muted)]/50 dark:hover:bg-[var(--muted)]/30 hover:text-foreground',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md transition-colors',
                        active ? 'bg-[var(--muted)] dark:bg-[var(--muted)]' : 'bg-transparent',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold">{label}</span>
                      <span className="text-[9px] text-muted-foreground/60 text-left">
                        {description}
                      </span>
                    </div>
                    {active && (
                      <Check className="ml-auto h-3 w-3 text-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Terminal Section */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Terminal
            </span>
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/30 dark:bg-[var(--muted)]/10 p-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground dark:text-foreground">Default mode</span>
                <span className="text-[9px] text-muted-foreground/60">
                  Initial mode when opening terminal
                </span>
              </div>
              <Select
                value={preferencesDraft.default_terminal_mode || 'adb-shell'}
                onValueChange={(v) => onDraftChange({ default_terminal_mode: v ?? undefined })}
              >
                <SelectTrigger className="w-[120px] h-8 rounded-full text-xs bg-card dark:bg-[var(--muted)]/60 border border-[var(--border)] dark:border-[var(--border)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[var(--border)] dark:border-[var(--border)]">
                  {TERMINAL_MODES.map(({ value, label }) => (
                    <SelectItem key={value} value={value} className="text-xs cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Device Sync Section */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Device Sync
            </span>
            <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/30 dark:bg-[var(--muted)]/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground dark:text-foreground">Auto-refresh</span>
                  <span className="text-[9px] text-muted-foreground/60">
                    Automatically sync connected devices
                  </span>
                </div>
                <Switch
                  checked={preferencesDraft.auto_refresh_devices ?? true}
                  onCheckedChange={(v) => onDraftChange({ auto_refresh_devices: v })}
                />
              </div>
              {(preferencesDraft.auto_refresh_devices ?? true) && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] dark:border-[var(--border)]/80">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground dark:text-foreground">Interval</span>
                    <span className="text-[9px] text-muted-foreground/60">
                      Sync frequency in seconds
                    </span>
                  </div>
                  <div className="relative flex items-center shrink-0">
                    <Input
                      type="number"
                      min={2}
                      max={60}
                      value={preferencesDraft.device_refresh_seconds ?? 8}
                      onChange={(e) => {
                        const v = Number.parseInt(e.target.value, 10)
                        if (!Number.isNaN(v)) onDraftChange({ device_refresh_seconds: v })
                      }}
                      className="w-16 h-8 rounded-full text-xs font-mono text-center bg-card dark:bg-[var(--muted)]/60 border border-[var(--border)] dark:border-[var(--border)] pr-5"
                    />
                    <span className="absolute right-2 text-[9px] text-muted-foreground dark:text-muted-foreground pointer-events-none font-mono">s</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="text-[11px] text-[var(--destructive)] font-semibold mt-2">{errorMessage}</p>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border)] dark:border-[var(--border)]/80">
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            disabled={!hasChanges || saving}
            className="rounded-full h-8 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="mr-1.5 h-3 w-3" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!hasChanges || saving}
            className="rounded-full h-8 text-xs font-semibold cursor-pointer bg-primary hover:bg-primary/95 text-primary-foreground border-0 shadow-sm transition-all active:scale-[0.96]"
          >
            {saving ? (
              <>
                <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Saving
              </>
            ) : (
              <>
                {hasChanges && <Save className="mr-1.5 h-3 w-3" />}
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
