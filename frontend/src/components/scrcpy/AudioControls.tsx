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

interface AudioChoice {
  value: string
  name: string
  description: string
}

const AUDIO_CODECS: AudioChoice[] = [
  { value: 'opus', name: 'Opus', description: 'Default, low latency' },
  { value: 'aac', name: 'AAC', description: 'Wide device support' },
  { value: 'flac', name: 'FLAC', description: 'Lossless, large files' },
  { value: 'raw', name: 'RAW', description: 'Uncompressed PCM' },
]

export function AudioControls({ options, onOptionChange }: AudioControlsProps) {
  return (
    <div className="space-y-4">
      {/* Disable Audio Switch */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="space-y-0.5">
          <Label htmlFor="no-audio" className="text-xs font-bold text-foreground">
            Disable Audio
          </Label>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Mute audio capture during mirroring.
          </p>
        </div>
        <Switch
          id="no-audio"
          checked={options.no_audio}
          onCheckedChange={(checked) => onOptionChange('no_audio', checked)}
        />
      </div>

      {/* Audio Codec Select */}
      <div className="space-y-1.5">
        <Label htmlFor="audio-codec" className="text-xs font-bold text-foreground">
          Audio Codec
        </Label>
        <Select
          value={options.audio_codec || 'opus'}
          onValueChange={(value) => onOptionChange('audio_codec', String(value ?? 'opus'))}
          disabled={options.no_audio}
        >
          <SelectTrigger id="audio-codec" className="h-8.5 rounded-full text-xs bg-background dark:bg-card/60 border border-border focus:ring-1 focus:ring-ring">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[240px] rounded-2xl border-border">
            {AUDIO_CODECS.map((codec) => (
              <SelectItem key={codec.value} value={codec.value} className="py-2 cursor-pointer">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs font-semibold">{codec.name}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-normal">
                    {codec.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audio Bitrate */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="audio-bit-rate" className="text-xs font-bold text-foreground">
            Audio Bitrate
          </Label>
          <span className="text-[10px] font-bold text-muted-foreground font-mono">
            {options.audio_bit_rate === 0
              ? 'Default'
              : `${(options.audio_bit_rate / 1000).toFixed(0)} kbps`}
          </span>
        </div>
        <div className="relative flex items-center">
          <Input
            id="audio-bit-rate"
            type="number"
            min={0}
            step={8}
            value={options.audio_bit_rate === 0 ? 0 : Math.round(options.audio_bit_rate / 1000)}
            disabled={options.no_audio}
            onChange={(e) => {
              const kbps = parseFloat(e.target.value) || 0
              onOptionChange('audio_bit_rate', Math.round(kbps * 1000))
            }}
            className="h-8.5 w-full rounded-full border border-border bg-background dark:bg-card/60 focus-visible:ring-1 focus-visible:ring-ring text-xs pl-3.5 pr-8"
          />
          <span className="absolute right-3 text-[9px] text-muted-foreground dark:text-muted-foreground pointer-events-none font-mono">k</span>
        </div>
      </div>
    </div>
  )
}
