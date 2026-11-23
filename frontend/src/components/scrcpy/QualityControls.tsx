import type { CSSProperties, ReactNode } from 'react'
import type { ScrcpyOptions } from '@/lib/types'
import { Selector } from '@astryxdesign/core/Selector'
import {
  IconVideo,
  IconCpu,
  IconMaximize,
  IconGauge,
  IconFrame,
} from "@tabler/icons-react"

interface QualityControlsProps {
  options: ScrcpyOptions
  onOptionChange: (key: string, value: number | string | boolean) => void
}

const VIDEO_CODECS = [
  { value: 'h264', label: 'H.264', description: 'Universal, best compatibility' },
  { value: 'h265', label: 'H.265', description: 'Better compression, smaller files' },
  { value: 'av1', label: 'AV1', description: 'Best compression, newer devices only' },
  { value: 'vp8', label: 'VP8', description: 'WebM legacy, broad compatibility' },
  { value: 'vp9', label: 'VP9', description: 'WebM, better compression than VP8' },
]

const HW_DECODING = [
  { value: 'auto', label: 'Auto', description: 'Let scrcpy pick the decoder (default)' },
  { value: 'disabled', label: 'Disabled', description: 'Software decoding, use if the picture is black or glitchy' },
]

const inputClass =
  'h-11 w-full rounded-full bg-[var(--color-background-card)] px-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]'
const keycapClass =
  'h-11 w-24 shrink-0 rounded-full bg-[var(--color-background-card)] text-center font-mono text-[14px] text-[var(--color-text-primary)] outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]'

function Tile({
  icon,
  label,
  readout,
  children,
}: {
  icon: ReactNode
  label: string
  readout?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-3 rounded-xl bg-[var(--color-surface-inset)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="flex items-center gap-2 whitespace-nowrap text-[15px] font-semibold text-[var(--color-text-primary)]">
          <span className="text-[var(--color-text-secondary)]">{icon}</span>
          {label}
        </p>
        {readout && (
          <span className="shrink-0 font-mono text-[14px] text-[var(--color-text-secondary)] tabular-nums">{readout}</span>
        )}
      </div>
      {children}
    </div>
  )
}

export function QualityControls({ options, onOptionChange }: QualityControlsProps) {
  const codec = VIDEO_CODECS.find((c) => c.value === (options.video_codec || 'h264'))
  const hwDec = HW_DECODING.find((c) => c.value === (options.hw_dec || 'auto'))

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Tile icon={<IconVideo size={18} stroke={1.75} />} label="Video codec">
          <Selector
            label="Video codec"
            isLabelHidden
            value={options.video_codec || 'h264'}
            onChange={(v) => onOptionChange('video_codec', String(v))}
            options={VIDEO_CODECS.map(({ value, label }) => ({ value, label }))}
          />
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{codec?.description}</p>
        </Tile>

        <Tile icon={<IconCpu size={18} stroke={1.75} />} label="Hardware decoding">
          <Selector
            label="Hardware decoding"
            isLabelHidden
            value={options.hw_dec || 'auto'}
            onChange={(v) => onOptionChange('hw_dec', v === 'auto' ? '' : String(v))}
            options={HW_DECODING}
          />
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{hwDec?.description}</p>
        </Tile>

        <Tile
          icon={<IconMaximize size={18} stroke={1.75} />}
          label="Max resolution"
          readout={options.max_size === 0 ? 'Unlimited' : `${options.max_size}px`}
        >
          <input
            id="max-size"
            type="number"
            min={0}
            step={64}
            value={options.max_size}
            onChange={(e) => onOptionChange('max_size', Number(e.target.value) || 0)}
            placeholder="0 = unlimited"
            aria-label="Max resolution"
            className={inputClass}
          />
        </Tile>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          icon={<IconGauge size={18} stroke={1.75} />}
          label="Video bitrate"
          readout={options.bit_rate === 0 ? 'Default' : `${(options.bit_rate / 1_000_000).toFixed(1)} Mbps`}
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={20_000_000}
              step={500_000}
              value={options.bit_rate}
              onChange={(e) => onOptionChange('bit_rate', Number(e.target.value))}
              aria-label="Video bitrate"
              className="range-tonal w-full"
              style={{ '--range-fill': `${(options.bit_rate / 20_000_000) * 100}%` } as CSSProperties}
            />
            <input
              type="number"
              min={0}
              max={20}
              step={0.1}
              aria-label="Video bitrate in Mbps"
              value={options.bit_rate === 0 ? 0 : Number((options.bit_rate / 1_000_000).toFixed(1))}
              onChange={(e) => {
                const mbps = parseFloat(e.target.value) || 0
                onOptionChange('bit_rate', Math.round(mbps * 1_000_000))
              }}
              className={keycapClass}
            />
          </div>
        </Tile>

        <Tile
          icon={<IconFrame size={18} stroke={1.75} />}
          label="Max FPS"
          readout={options.max_fps === 0 ? 'Unlimited' : `${options.max_fps} FPS`}
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={120}
              step={5}
              value={options.max_fps}
              onChange={(e) => onOptionChange('max_fps', Number(e.target.value))}
              aria-label="Max FPS"
              className="range-tonal w-full"
              style={{ '--range-fill': `${(options.max_fps / 120) * 100}%` } as CSSProperties}
            />
            <input
              type="number"
              min={0}
              max={120}
              aria-label="Max FPS value"
              value={options.max_fps}
              onChange={(e) => onOptionChange('max_fps', Number(e.target.value) || 0)}
              className={keycapClass}
            />
          </div>
        </Tile>
      </div>
    </div>
  )
}