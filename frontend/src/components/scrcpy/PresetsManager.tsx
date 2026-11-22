import { useState } from 'react'
import {
  IconBookmark as Bookmark,
  IconTrash as Trash2
} from "@tabler/icons-react"
import type { ScrcpyOptions, ScrcpyPreset } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarqueeText } from './MarqueeText'

interface PresetsManagerProps {
  currentOptions: ScrcpyOptions
  presets: ScrcpyPreset[]
  onApplyPreset: (options: ScrcpyOptions) => void
  onSavePreset: (name: string) => void
  onDeletePreset: (id: string) => void
}

export function PresetsManager({
  currentOptions,
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
}: PresetsManagerProps) {
  const [draftName, setDraftName] = useState('')

  const handleSave = () => {
    const trimmed = draftName.trim()
    if (!trimmed) return
    onSavePreset(trimmed)
    setDraftName('')
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-2xl bg-[var(--color-surface-inset)] p-4">
        <label className="text-[15px] font-semibold text-[var(--color-text-primary)]" htmlFor="preset-name">
          Save current options as preset
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="preset-name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Preset name"
            className="h-11 min-w-0 flex-1 rounded-full bg-[var(--color-background-card)] px-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!draftName.trim()}
            className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
          >
            <Bookmark size={18} stroke={1.75} />
            Save
          </button>
        </div>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          Captures max size, bitrate, fps, codecs, audio, and device toggles
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Saved presets</h4>
        {presets.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-border/40 p-6 text-center text-[14px] text-[var(--color-text-secondary)]">
            No presets yet. Save your current options to create one
          </p>
        ) : (
          <ScrollArea className="max-h-72 pr-2">
            <ul className="space-y-2">
              {presets.map((preset) => (
                <li
                  key={preset.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface-inset)] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <MarqueeText title={preset.name} className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {preset.name}
                    </MarqueeText>
                    <p className="text-[14px] text-[var(--color-text-secondary)]">
                      {new Date(preset.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onApplyPreset(preset.options)}
                      className="flex h-9 items-center rounded-full border border-border/50 px-4 text-[14px] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePreset(preset.id)}
                      aria-label={`Delete preset ${preset.name}`}
                      className="flex size-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-error)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      <Trash2 size={16} stroke={1.75} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>

      <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[14px] text-[var(--color-text-secondary)]">
        <span>max {currentOptions.max_size === 0 ? 'unlimited' : `${currentOptions.max_size}px`}</span>
        <span>{(currentOptions.bit_rate / 1_000_000).toFixed(1)} Mbps</span>
        <span>{currentOptions.max_fps === 0 ? 'unlimited' : currentOptions.max_fps} fps</span>
      </p>
    </div>
  )
}