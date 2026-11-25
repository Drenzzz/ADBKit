import type { ScrcpyOptions } from '@/lib/types'
import { Switch } from '@astryxdesign/core/Switch'
import { Selector } from '@astryxdesign/core/Selector'
import { FieldLabel } from '@astryxdesign/core/Field'

interface DeviceOptionsControlsProps {
  options: ScrcpyOptions
  onOptionChange: (key: string, value: number | string | boolean) => void
  displays?: Array<{ id: number; name: string }>
  androidSdk?: number | null
}

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {label}
        </p>
        <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
      </div>
      <Switch label={label} isLabelHidden value={checked} onChange={onChange} />
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-full bg-[var(--color-background-card)] px-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]'
const labelClass = 'text-[15px] font-semibold text-[var(--color-text-primary)]'

export function DeviceOptionsControls({
  options,
  onOptionChange,
  displays,
  androidSdk,
}: DeviceOptionsControlsProps) {
  const cameraSupported = androidSdk == null || androidSdk >= 31
  const audioOnlySupported = true
  return (
    <div className="space-y-5">
      <div className="divide-y divide-border/40">
        <ToggleRow
          label="Show touches"
          description="Visualize physical touches on the device"
          checked={options.show_touches}
          onChange={(v) => onOptionChange('show_touches', v)}
        />
        <ToggleRow
          label="Read-only"
          description="Disable input control from mirror window"
          checked={options.no_control}
          onChange={(v) => onOptionChange('no_control', v)}
        />
        <ToggleRow
          label="Stay awake"
          description="Keep the device awake while connected"
          checked={options.stay_awake}
          onChange={(v) => onOptionChange('stay_awake', v)}
        />
        <ToggleRow
          label="Turn screen off"
          description="Turn off device screen while mirroring"
          checked={options.turn_screen_off}
          onChange={(v) => onOptionChange('turn_screen_off', v)}
        />
        <ToggleRow
          label="Power off on close"
          description="Power off device when mirror window closes"
          checked={options.power_off_on_close}
          onChange={(v) => onOptionChange('power_off_on_close', v)}
        />
        <ToggleRow
          label="Fullscreen"
          description="Open mirror window in fullscreen"
          checked={options.fullscreen}
          onChange={(v) => onOptionChange('fullscreen', v)}
        />
        <ToggleRow
          label="Always on top"
          description="Keep mirror window above other windows"
          checked={options.always_on_top}
          onChange={(v) => onOptionChange('always_on_top', v)}
        />
        <ToggleRow
          label="Disable screensaver"
          description="Prevent host screensaver during mirroring"
          checked={options.disable_screensaver}
          onChange={(v) => onOptionChange('disable_screensaver', v)}
        />
        <ToggleRow
          label="Audio only"
          description="Forward audio without video (no-video)"
          checked={options.no_video}
          onChange={(v) => onOptionChange('no_video', v)}
        />
        {!audioOnlySupported && (
          <p className="text-[14px] text-[var(--color-text-secondary)]">Audio-only not supported</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <FieldLabel label="Video source" inputID="video-source" className={labelClass} />
          <Selector
            label="Video source"
            isLabelHidden
            value={options.video_source || 'display'}
            onChange={(v) => onOptionChange('video_source', String(v))}
            options={[
              { value: 'display', label: 'Display' },
              { value: 'camera', label: 'Camera' },
            ]}
          />
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            Camera mirroring requires Android 12+
            {!cameraSupported && ' (not supported on this device)'}
          </p>
        </div>
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <FieldLabel label="Window width" inputID="window-width" className={labelClass} />
          <input
            id="window-width"
            type="number"
            min={0}
            value={options.window_width}
            onChange={(e) => onOptionChange('window_width', Number(e.target.value) || 0)}
            placeholder="0 = auto"
            className={inputClass}
          />
        </div>
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <FieldLabel label="Window height" inputID="window-height" className={labelClass} />
          <input
            id="window-height"
            type="number"
            min={0}
            value={options.window_height}
            onChange={(e) => onOptionChange('window_height', Number(e.target.value) || 0)}
            placeholder="0 = auto"
            className={inputClass}
          />
        </div>
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <FieldLabel label="Window X" inputID="window-x" className={labelClass} />
          <input
            id="window-x"
            type="number"
            min={0}
            value={options.window_x}
            onChange={(e) => onOptionChange('window_x', Number(e.target.value) || 0)}
            placeholder="0 = default"
            className={inputClass}
          />
        </div>
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <FieldLabel label="Window Y" inputID="window-y" className={labelClass} />
          <input
            id="window-y"
            type="number"
            min={0}
            value={options.window_y}
            onChange={(e) => onOptionChange('window_y', Number(e.target.value) || 0)}
            placeholder="0 = default"
            className={inputClass}
          />
        </div>
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <FieldLabel label="Display ID" inputID="display-id" className={labelClass} />
          {displays && displays.length > 0 ? (
            <Selector
              label="Display ID"
              isLabelHidden
              value={String(options.display_id)}
              onChange={(v) => onOptionChange('display_id', Number(v) || 0)}
              options={displays.map((d) => ({ value: String(d.id), label: d.name || `Display ${d.id}` }))}
            />
          ) : (
            <input
              id="display-id"
              type="number"
              min={0}
              value={options.display_id}
              onChange={(e) => onOptionChange('display_id', Number(e.target.value) || 0)}
              className={inputClass}
            />
          )}
        </div>
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <FieldLabel label="Rotation" inputID="rotation" className={labelClass} />
          <input
            id="rotation"
            type="number"
            min={0}
            max={3}
            value={options.rotation}
            onChange={(e) => onOptionChange('rotation', Number(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <FieldLabel label="Time limit (seconds, 0 = none)" inputID="time-limit" className={labelClass} />
          <input
            id="time-limit"
            type="number"
            min={0}
            value={options.time_limit}
            onChange={(e) => onOptionChange('time_limit', Number(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}