import { useState } from 'react'
import {
  IconBookmark as Bookmark,
  IconTrash as Trash2
} from "@tabler/icons-react"
import type { ScrcpyOptions, ScrcpyPreset } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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
    <div className="space-y-4">
      <Card className="border-border/50 bg-background/50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium" htmlFor="preset-name">
              Save current options as preset
            </label>
            <Input
              id="preset-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Low-latency, High quality"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!draftName.trim()}
            className="gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Save
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Captures max size, bitrate, fps, codecs, audio, and device toggles.
        </p>
      </Card>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Saved presets</h4>
        {presets.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground">
            No presets yet. Save your current options to create one.
          </p>
        ) : (
          <ScrollArea className="max-h-64 pr-2">
            <ul className="space-y-2">
              {presets.map((preset) => (
                <li
                  key={preset.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(preset.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onApplyPreset(preset.options)}
                    >
                      Apply
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeletePreset(preset.id)}
                      aria-label={`Delete preset ${preset.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Active options: max {currentOptions.max_size === 0 ? '∞' : currentOptions.max_size}px ·{' '}
        {(currentOptions.bit_rate / 1_000_000).toFixed(1)} Mbps ·{' '}
        {currentOptions.max_fps === 0 ? '∞' : currentOptions.max_fps} fps
      </p>
    </div>
  )
}
