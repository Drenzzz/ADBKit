import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, Sun, Moon, RotateCcw, Save } from 'lucide-react'

interface PreferencesPanelProps {
  theme: 'dark' | 'light'
  saving: boolean
  hasChanges: boolean
  errorMessage: string | null
  onThemeChange: (theme: 'dark' | 'light') => void
  onSave: () => void
  onReset: () => void
}

const THEME_OPTIONS: { value: 'dark' | 'light'; label: string; description: string; Icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', description: 'Low-light interface', Icon: Moon },
  { value: 'light', label: 'Light', description: 'Bright environment interface', Icon: Sun },
]

export function PreferencesPanel({
  theme,
  saving,
  hasChanges,
  errorMessage,
  onThemeChange,
  onSave,
  onReset,
}: PreferencesPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
          Appearance
        </span>
        <div className="inline-flex w-full items-center gap-1 rounded-lg border border-border/40 p-1">
          {THEME_OPTIONS.map(({ value, label, description, Icon }) => {
            const active = theme === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onThemeChange(value)}
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
