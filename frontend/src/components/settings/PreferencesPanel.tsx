import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Check, Sun, Moon, RotateCcw, Save } from 'lucide-react'
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
  { value: 'dark', label: 'Dark', description: 'Low-light interface', Icon: Moon },
  { value: 'light', label: 'Light', description: 'Bright environment interface', Icon: Sun },
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
          Appearance
        </span>
        <div className="inline-flex w-full items-center gap-1 rounded-lg border border-border/40 p-1">
          {THEME_OPTIONS.map(({ value, label, description, Icon }) => {
            const active = preferencesDraft.theme === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onDraftChange({ theme: value })}
                className={cn(
                  'flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                    active ? 'bg-background' : 'bg-transparent',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {description}
                  </span>
                </div>
                {active && (
                  <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
          Terminal
        </span>
        <div className="flex flex-col gap-3 rounded-lg border border-border/40 p-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium">Default mode</span>
              <span className="text-[10px] text-muted-foreground/60">
                Mode awal saat membuka terminal
              </span>
            </div>
            <Select
              value={preferencesDraft.default_terminal_mode ?? 'adb-shell'}
              onValueChange={(v) => onDraftChange({ default_terminal_mode: v })}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERMINAL_MODES.map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
          Device Sync
        </span>
        <div className="flex flex-col gap-3 rounded-lg border border-border/40 p-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium">Auto-refresh device list</span>
              <span className="text-[10px] text-muted-foreground/60">
                Sinkronisasi otomatis device yang terhubung
              </span>
            </div>
            <Switch
              checked={preferencesDraft.auto_refresh_devices ?? true}
              onCheckedChange={(v) => onDraftChange({ auto_refresh_devices: v })}
            />
          </div>
          {(preferencesDraft.auto_refresh_devices ?? true) && (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-medium">Refresh interval</span>
                <span className="text-[10px] text-muted-foreground/60">
                  Detik antara setiap sinkronisasi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={2}
                  max={60}
                  value={preferencesDraft.device_refresh_seconds ?? 8}
                  onChange={(e) => {
                    const v = Number.parseInt(e.target.value, 10)
                    if (!Number.isNaN(v)) onDraftChange({ device_refresh_seconds: v })
                  }}
                  className="w-16 h-8 text-xs text-right"
                />
                <span className="text-[10px] text-muted-foreground/60">s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
          Logcat
        </span>
        <div className="flex flex-col gap-3 rounded-lg border border-border/40 p-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium">Buffer limit</span>
              <span className="text-[10px] text-muted-foreground/60">
                Maksimal jumlah log entry yang disimpan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1000}
                max={100000}
                step={1000}
                value={preferencesDraft.logcat_buffer_limit ?? 5000}
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value, 10)
                  if (!Number.isNaN(v)) onDraftChange({ logcat_buffer_limit: v })
                }}
                className="w-20 h-8 text-xs text-right"
              />
              <span className="text-[10px] text-muted-foreground/60">lines</span>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={!hasChanges || saving}
        >
          <RotateCcw className="mr-1.5 h-3 w-3" />
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              Saving
            </>
          ) : (
            <>
              {hasChanges && <Save className="mr-1.5 h-3 w-3" />}
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
