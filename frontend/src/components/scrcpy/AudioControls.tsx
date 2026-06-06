import type { ScrcpyOptions } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AudioControlsProps {
  options: ScrcpyOptions
  onOptionChange: (key: string, value: number | string | boolean) => void
}

export function AudioControls({ options, onOptionChange }: AudioControlsProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="no-audio" className="text-sm">
            Disable audio
          </Label>
          <p className="text-xs text-muted-foreground">
            Mute audio capture during mirroring. Your device will still play
            sounds on its own.
          </p>
        </div>
        <Switch
          id="no-audio"
          checked={options.no_audio}
          onCheckedChange={(checked) => onOptionChange('no_audio', checked)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="audio-codec" className="text-sm">
          Audio codec
        </Label>
        <Select
          value={options.audio_codec || 'opus'}
          onValueChange={(value) => onOptionChange('audio_codec', String(value ?? 'opus'))}
          disabled={options.no_audio}
        >
          <SelectTrigger id="audio-codec">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opus">opus (default)</SelectItem>
            <SelectItem value="aac">aac</SelectItem>
            <SelectItem value="flac">flac</SelectItem>
            <SelectItem value="raw">raw</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="audio-bit-rate" className="text-sm">
            Audio bitrate
          </Label>
          <span className="text-xs text-muted-foreground">
            {options.audio_bit_rate === 0
              ? 'Default'
              : `${(options.audio_bit_rate / 1000).toFixed(0)} kbps`}
          </span>
        </div>
        <Input
          id="audio-bit-rate"
          type="number"
          min={0}
          step={8000}
          value={options.audio_bit_rate}
          disabled={options.no_audio}
          onChange={(e) =>
            onOptionChange('audio_bit_rate', Number(e.target.value) || 0)
          }
        />
      </div>
    </div>
  )
}
