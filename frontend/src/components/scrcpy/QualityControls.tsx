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
  { value: 'h264', name: 'H.264', description: 'Universal, best compatibility' },
  { value: 'h265', name: 'H.265', description: 'Better compression, smaller files' },
  { value: 'av1', name: 'AV1', description: 'Best compression, newer devices only' },
]

export function QualityControls({ options, onOptionChange }: QualityControlsProps) {
  return (
    <div className="space-y-4">
      {/* Video Codec */}
      <div className="space-y-1.5">
        <Label htmlFor="video-codec" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Video Codec
        </Label>
        <Select
          value={options.video_codec || 'h264'}
          onValueChange={(value) => onOptionChange('video_codec', String(value ?? 'h264'))}
        >
          <SelectTrigger id="video-codec" className="h-8.5 rounded-full text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[280px] rounded-2xl border-zinc-200 dark:border-zinc-800">
            {VIDEO_CODECS.map((codec) => (
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

      {/* Max Resolution */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="max-size" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Max Resolution
          </Label>
          <span className="text-[10px] font-bold text-muted-foreground font-mono">
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
          className="h-8.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 text-xs pl-3.5"
        />
      </div>

      {/* Video Bitrate */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="bit-rate" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Video Bitrate
          </Label>
          <span className="text-[10px] font-bold text-muted-foreground font-mono">
            {options.bit_rate === 0
              ? 'Default'
              : `${(options.bit_rate / 1_000_000).toFixed(1)} Mbps`}
          </span>
        </div>
        <div className="flex items-center gap-3">
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
            className="flex-1"
          />
          <div className="relative flex items-center shrink-0">
            <Input
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={options.bit_rate === 0 ? 0 : Number((options.bit_rate / 1_000_000).toFixed(1))}
              onChange={(e) => {
                const mbps = parseFloat(e.target.value) || 0
                onOptionChange('bit_rate', Math.round(mbps * 1_000_000))
              }}
              className="w-20 h-8 rounded-full text-xs font-mono text-center bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 pr-5"
            />
          </div>
        </div>
      </div>

      {/* Max FPS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="max-fps" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Max FPS
          </Label>
          <span className="text-[10px] font-bold text-muted-foreground font-mono">
            {options.max_fps === 0 ? 'Unlimited' : `${options.max_fps} FPS`}
          </span>
        </div>
        <div className="flex items-center gap-3">
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
            className="flex-1"
          />
          <div className="relative flex items-center shrink-0">
            <Input
              type="number"
              min={0}
              max={120}
              value={options.max_fps}
              onChange={(e) => onOptionChange('max_fps', Number(e.target.value) || 0)}
              className="w-20 h-8 rounded-full text-xs font-mono text-center bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 pr-5"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
