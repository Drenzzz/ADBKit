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
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
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
    <div className="space-y-1">
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
        description="Disable input control from the mirror window."
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
        description="Turn off the device screen while mirroring."
        checked={options.turn_screen_off}
        onChange={(v) => onOptionChange('turn_screen_off', v)}
      />
      <ToggleRow
        id="power-off-on-close"
        label="Power off on close"
        description="Power off the device when the mirror window closes."
        checked={options.power_off_on_close}
        onChange={(v) => onOptionChange('power_off_on_close', v)}
      />
      <ToggleRow
        id="fullscreen"
        label="Fullscreen"
        description="Open the mirror window in fullscreen."
        checked={options.fullscreen}
        onChange={(v) => onOptionChange('fullscreen', v)}
      />
      <ToggleRow
        id="always-on-top"
        label="Always on top"
        description="Keep the mirror window above other windows."
        checked={options.always_on_top}
        onChange={(v) => onOptionChange('always_on_top', v)}
      />
      <ToggleRow
        id="disable-screensaver"
        label="Disable screensaver"
        description="Prevent the host screensaver during mirroring."
        checked={options.disable_screensaver}
        onChange={(v) => onOptionChange('disable_screensaver', v)}
      />

      <Separator className="my-2" />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="display-id" className="text-sm">
            Display ID
          </Label>
          <Input
            id="display-id"
            type="number"
            min={0}
            value={options.display_id}
            onChange={(e) => onOptionChange('display_id', Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rotation" className="text-sm">
            Rotation
          </Label>
          <Input
            id="rotation"
            type="number"
            min={0}
            max={3}
            value={options.rotation}
            onChange={(e) => onOptionChange('rotation', Number(e.target.value) || 0)}
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="time-limit" className="text-sm">
            Time limit (seconds, 0 = none)
          </Label>
          <Input
            id="time-limit"
            type="number"
            min={0}
            value={options.time_limit}
            onChange={(e) => onOptionChange('time_limit', Number(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  )
}
