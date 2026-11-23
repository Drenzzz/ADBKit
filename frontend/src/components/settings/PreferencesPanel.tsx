import type { ReactNode } from 'react'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Selector } from '@astryxdesign/core/Selector'
import { Switch } from '@astryxdesign/core/Switch'
import {
  IconSun as Sun,
  IconMoon as Moon,
  IconRotate2 as RotateCcw,
  IconDeviceFloppy as Save,
  IconSettings as Settings,
  IconArrowsMaximize as Maximize,
  IconArrowsMinimize as Windowed,
  IconRectangle as Rectangle,
  IconLoader2 as Loader2,
} from "@tabler/icons-react"
import type { PreferencesPayload } from '@/lib/types'
import type { WindowStateOption } from '@/services/settingsService'
import { SettingsSection } from './SettingsSection'

interface PreferencesPanelProps {
  preferencesDraft: PreferencesPayload
  saving: boolean
  hasChanges: boolean
  errorMessage: string | null
  onDraftChange: (draft: Partial<PreferencesPayload>) => void
  onSave: () => void
  onReset: () => void
  windowState?: WindowStateOption
  savingWindowState?: boolean
  onWindowStateChange?: (state: WindowStateOption) => void
}

const TERMINAL_MODES = [
  { value: 'adb-shell', label: 'ADB Shell' },
  { value: 'adb-host', label: 'ADB Host' },
  { value: 'fastboot-host', label: 'Fastboot Host' },
]

const WINDOW_STATE_OPTIONS: {
  value: WindowStateOption
  label: string
  description: string
}[] = [
  { value: 'maximised', label: 'Maximized', description: 'Fill the screen' },
  { value: 'normal', label: 'Windowed', description: 'Default 1280×800' },
  { value: 'fullscreen', label: 'Fullscreen', description: 'No chrome' },
]

function PrefRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
      <div className="min-w-0 space-y-0.5">
        <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">{label}</p>
        <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const outlineButton =
  'flex h-11 items-center gap-2 rounded-full border border-border/50 px-5 text-[15px] font-semibold text-[var(--color-text-primary)] transition-[background-color,opacity] duration-150 hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none'

export function PreferencesPanel({
  preferencesDraft,
  saving,
  hasChanges,
  errorMessage,
  onDraftChange,
  onSave,
  onReset,
  windowState,
  savingWindowState,
  onWindowStateChange,
}: PreferencesPanelProps) {
  const windowDescription = WINDOW_STATE_OPTIONS.find((o) => o.value === windowState)?.description

  return (
    <SettingsSection icon={<Settings size={20} stroke={1.75} />} title="Preferences">
      <div className="divide-y divide-border/40">
        <PrefRow label="Theme" description="Interface appearance for every page">
          <SegmentedControl
            value={preferencesDraft.theme}
            onChange={(v) => onDraftChange({ theme: v as 'dark' | 'light' })}
            label="Theme"
          >
            <SegmentedControlItem value="dark" label="Dark" icon={<Moon size={18} stroke={1.75} />} />
            <SegmentedControlItem value="light" label="Light" icon={<Sun size={18} stroke={1.75} />} />
          </SegmentedControl>
        </PrefRow>

        {onWindowStateChange && (
          <PrefRow
            label="Window"
            description={`${windowDescription ?? 'Fill the screen'} · takes effect on next launch`}
          >
            <SegmentedControl
              value={windowState ?? 'maximised'}
              onChange={(v) => onWindowStateChange(v as WindowStateOption)}
              isDisabled={savingWindowState}
              label="Window state"
            >
              {WINDOW_STATE_OPTIONS.map(({ value, label }) => (
                <SegmentedControlItem
                  key={value}
                  value={value}
                  label={label}
                  icon={
                    value === 'maximised' ? <Maximize size={18} stroke={1.75} />
                    : value === 'normal' ? <Windowed size={18} stroke={1.75} />
                    : <Rectangle size={18} stroke={1.75} />
                  }
                />
              ))}
            </SegmentedControl>
          </PrefRow>
        )}

        <PrefRow label="Default terminal mode" description="Initial mode when opening terminal">
          <div className="w-[180px]">
            <Selector
              label="Default terminal mode"
              isLabelHidden
              value={preferencesDraft.default_terminal_mode || 'adb-shell'}
              onChange={(v) => onDraftChange({ default_terminal_mode: String(v) })}
              options={TERMINAL_MODES}
            />
          </div>
        </PrefRow>

        <PrefRow label="Auto-refresh devices" description="Automatically sync connected devices">
          <Switch
            label="Auto-refresh devices"
            isLabelHidden
            value={preferencesDraft.auto_refresh_devices ?? true}
            onChange={(v) => onDraftChange({ auto_refresh_devices: v })}
          />
        </PrefRow>

        {(preferencesDraft.auto_refresh_devices ?? true) && (
          <PrefRow label="Refresh interval" description="Sync frequency in seconds">
            <div className="relative flex items-center">
              <input
                type="number"
                min={2}
                max={60}
                aria-label="Refresh interval in seconds"
                value={preferencesDraft.device_refresh_seconds ?? 8}
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value, 10)
                  if (!Number.isNaN(v)) onDraftChange({ device_refresh_seconds: v })
                }}
                className="h-11 w-24 rounded-full bg-[var(--color-background-card)] px-4 pr-8 text-center font-mono text-[14px] text-[var(--color-text-primary)] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              />
              <span className="pointer-events-none absolute right-4 font-mono text-[13px] text-[var(--color-text-secondary)]">s</span>
            </div>
          </PrefRow>
        )}

        <PrefRow label="Audit logs" description="Record operation history for debugging">
          <Switch
            label="Audit logs"
            isLabelHidden
            value={preferencesDraft.audit_enabled ?? false}
            onChange={(v) => onDraftChange({ audit_enabled: v })}
          />
        </PrefRow>
      </div>

      {errorMessage && (
        <p className="mt-3 text-[14px] font-semibold text-[var(--color-error)]">{errorMessage}</p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/40 pt-4">
        <button type="button" onClick={onReset} disabled={!hasChanges || saving} className={outlineButton}>
          <RotateCcw size={18} stroke={1.75} />
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!hasChanges || saving}
          className="flex h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-[15px] font-bold text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {saving ? (
            <Loader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none" />
          ) : (
            <Save size={18} stroke={1.75} />
          )}
          {saving ? 'Saving' : 'Save'}
        </button>
      </div>
    </SettingsSection>
  )
}