import type { ScrcpyOptions } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface DeviceOptionsControlsProps {
  options: ScrcpyOptions
  onOptionChange: (key: string, value: number | string | boolean) => void
}

interface ToggleRowProps {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          {label}
        </Label>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function DeviceOptionsControls({
  options,
  onOptionChange,
}: DeviceOptionsControlsProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-0.5 max-h-[220px] overflow-y-auto pr-1">
        <ToggleRow
          id="show-touches"
          label="Show touches"
          description="Visualize physical touches on the device."
          checked={options.show_touches}
          onChange={(v) => onOptionChange('show_touches', v)}
        />
        <ToggleRow
          id="no-control"
          label="Read-only"
          description="Disable input control from mirror window."
          checked={options.no_control}
          onChange={(v) => onOptionChange('no_control', v)}
        />
        <ToggleRow
          id="stay-awake"
          label="Stay awake"
          description="Keep the device awake while connected."
          checked={options.stay_awake}
          onChange={(v) => onOptionChange('stay_awake', v)}
        />
        <ToggleRow
          id="turn-screen-off"
          label="Turn screen off"
          description="Turn off device screen while mirroring."
          checked={options.turn_screen_off}
          onChange={(v) => onOptionChange('turn_screen_off', v)}
        />
        <ToggleRow
          id="power-off-on-close"
          label="Power off on close"
          description="Power off device when mirror window closes."
          checked={options.power_off_on_close}
          onChange={(v) => onOptionChange('power_off_on_close', v)}
        />
        <ToggleRow
          id="fullscreen"
          label="Fullscreen"
          description="Open mirror window in fullscreen."
          checked={options.fullscreen}
          onChange={(v) => onOptionChange('fullscreen', v)}
        />
        <ToggleRow
          id="always-on-top"
          label="Always on top"
          description="Keep mirror window above other windows."
          checked={options.always_on_top}
          onChange={(v) => onOptionChange('always_on_top', v)}
        />
        <ToggleRow
          id="disable-screensaver"
          label="Disable screensaver"
          description="Prevent host screensaver during mirroring."
          checked={options.disable_screensaver}
          onChange={(v) => onOptionChange('disable_screensaver', v)}
        />
      </div>

      <Separator className="bg-zinc-150 dark:bg-zinc-800/80 my-2" />

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5">
          <Label htmlFor="display-id" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            Display ID
          </Label>
          <Input
            id="display-id"
            type="number"
            min={0}
            value={options.display_id}
            onChange={(e) => onOptionChange('display_id', Number(e.target.value) || 0)}
            className="h-8.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 text-xs pl-3.5"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rotation" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            Rotation
          </Label>
          <Input
            id="rotation"
            type="number"
            min={0}
            max={3}
            value={options.rotation}
            onChange={(e) => onOptionChange('rotation', Number(e.target.value) || 0)}
            className="h-8.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 text-xs pl-3.5"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="time-limit" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            Time limit (seconds, 0 = none)
          </Label>
          <Input
            id="time-limit"
            type="number"
            min={0}
            value={options.time_limit}
            onChange={(e) => onOptionChange('time_limit', Number(e.target.value) || 0)}
            className="h-8.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 text-xs pl-3.5"
          />
        </div>
      </div>
    </div>
  )
}
