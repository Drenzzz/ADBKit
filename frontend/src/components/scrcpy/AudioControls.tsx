import type { ScrcpyOptions } from '@/lib/types'
import { Selector } from '@astryxdesign/core/Selector'
import { Switch } from '@astryxdesign/core/Switch'
import { IconVolume, IconGauge } from "@tabler/icons-react"

interface AudioControlsProps {
  options: ScrcpyOptions
  onOptionChange: (key: string, value: number | string | boolean) => void
}

const AUDIO_CODECS = [
  { value: 'opus', label: 'Opus', description: 'Default, low latency' },
  { value: 'aac', label: 'AAC', description: 'Wide device support' },
  { value: 'flac', label: 'FLAC', description: 'Lossless, large files' },
  { value: 'raw', label: 'RAW', description: 'Uncompressed PCM' },
]

export function AudioControls({ options, onOptionChange }: AudioControlsProps) {
  const codec = AUDIO_CODECS.find((c) => c.value === (options.audio_codec || 'opus'))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--color-surface-inset)] px-4 py-3.5">
        <div className="space-y-0.5">
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Disable audio
          </p>
          <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
            Mute audio capture during mirroring
          </p>
        </div>
        <Switch
          label="Disable audio"
          isLabelHidden
          value={options.no_audio}
          onChange={(checked) => onOptionChange('no_audio', checked)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-text-primary)]">
            <IconVolume size={18} stroke={1.75} className="text-[var(--color-text-secondary)]" />
            Audio codec
          </p>
          <Selector
            label="Audio codec"
            isLabelHidden
            value={options.audio_codec || 'opus'}
            onChange={(v) => onOptionChange('audio_codec', String(v))}
            options={AUDIO_CODECS.map(({ value, label }) => ({ value, label }))}
            isDisabled={options.no_audio}
          />
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{codec?.description}</p>
        </div>

        <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-text-primary)]">
              <IconGauge size={18} stroke={1.75} className="text-[var(--color-text-secondary)]" />
              Audio bitrate
            </p>
            <span className="font-mono text-[14px] text-[var(--color-text-secondary)] tabular-nums">
              {options.audio_bit_rate === 0 ? 'Default' : `${(options.audio_bit_rate / 1000).toFixed(0)} kbps`}
            </span>
          </div>
          <input
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
            className="h-11 w-full rounded-full bg-[var(--color-background-card)] px-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}