import type { ScrcpyOptions } from '@/lib/types'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface QualityControlsProps {
  options: ScrcpyOptions
  onOptionChange: (key: string, value: number | string | boolean) => void
}

interface CodecChoice {
  value: string
  name: string
  description: string
}

const VIDEO_CODECS: CodecChoice[] = [
  { value: 'h264', name: 'h264', description: 'Universal, best compatibility' },
  { value: 'h265', name: 'h265', description: 'Better compression, smaller files' },
  { value: 'av1', name: 'av1', description: 'Best compression, newer devices only' },
]

export function QualityControls({ options, onOptionChange }: QualityControlsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="video-codec" className="text-sm">
          Video codec
        </Label>
        <Select
          value={options.video_codec || 'h264'}
          onValueChange={(value) => onOptionChange('video_codec', String(value ?? 'h264'))}
        >
          <SelectTrigger id="video-codec">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[280px]">
            {VIDEO_CODECS.map((codec) => (
              <SelectItem key={codec.value} value={codec.value} className="py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-sm font-medium">{codec.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-normal">
                    {codec.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="max-size" className="text-sm">
            Max resolution
          </Label>
          <span className="text-xs text-muted-foreground">
            {options.max_size === 0 ? 'Unlimited' : `${options.max_size}px`}
          </span>
        </div>
        <Input
          id="max-size"
          type="number"
          min={0}
          step={64}
          value={options.max_size}
          onChange={(e) => onOptionChange('max_size', Number(e.target.value) || 0)}
          placeholder="0 = unlimited"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bit-rate" className="text-sm">
            Video bitrate
          </Label>
          <span className="text-xs text-muted-foreground">
            {options.bit_rate === 0
              ? 'Default'
              : `${(options.bit_rate / 1_000_000).toFixed(1)} Mbps`}
          </span>
        </div>
        <Slider
          id="bit-rate"
          min={0}
          max={20_000_000}
          step={500_000}
          value={[options.bit_rate]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value
            onOptionChange('bit_rate', Number(next ?? 0))
          }}
        />
        <Input
          type="number"
          min={0}
          step={500_000}
          value={options.bit_rate}
          onChange={(e) => onOptionChange('bit_rate', Number(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="max-fps" className="text-sm">
            Max FPS
          </Label>
          <span className="text-xs text-muted-foreground">
            {options.max_fps === 0 ? 'Unlimited' : `${options.max_fps} fps`}
          </span>
        </div>
        <Slider
          id="max-fps"
          min={0}
          max={120}
          step={5}
          value={[options.max_fps]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value
            onOptionChange('max_fps', Number(next ?? 0))
          }}
        />
        <Input
          type="number"
          min={0}
          max={120}
          value={options.max_fps}
          onChange={(e) => onOptionChange('max_fps', Number(e.target.value) || 0)}
        />
      </div>
    </div>
  )
}
