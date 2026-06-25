import { useState } from 'react'
import { ClipboardCopy, RefreshCw } from 'lucide-react'
import type { ScrcpyEncoderSupport } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EncoderBadge, EncoderLegend } from '@/components/scrcpy/EncoderBadge'

interface SettingsPanelProps {
  encoderSupport: ScrcpyEncoderSupport | null
  isFetchingEncoder: boolean
  onRefreshEncoder: () => void
  onPushClipboard: (text: string) => void
  onPullClipboard: () => void
  isConnected: boolean
}

export function SettingsPanel({
  encoderSupport,
  isFetchingEncoder,
  onRefreshEncoder,
  onPushClipboard,
  onPullClipboard,
  isConnected,
}: SettingsPanelProps) {
  const [clipboardDraft, setClipboardDraft] = useState('')

  return (
    <div className="space-y-4">
      {/* Clipboard Card */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-2xl shadow-sm p-4">
        <h3 className="mb-0.5 text-xs font-bold text-foreground">Clipboard Sync</h3>
        <p className="mb-3.5 text-[10px] text-muted-foreground leading-relaxed">
          Two-way clipboard synchronization between host and device.
        </p>

        <div className="space-y-3">
          <div className="relative flex items-center">
            <Input
              id="clipboard-draft"
              value={clipboardDraft}
              onChange={(e) => setClipboardDraft(e.target.value)}
              placeholder="Type text to send to device..."
              className="h-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 text-xs pl-3.5 pr-20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && clipboardDraft && isConnected) {
                  onPushClipboard(clipboardDraft)
                  setClipboardDraft('')
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                if (!clipboardDraft) return
                onPushClipboard(clipboardDraft)
                setClipboardDraft('')
              }}
              disabled={!clipboardDraft || !isConnected}
              className="absolute right-1 top-1 bottom-1 h-7 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-[10px] px-3 border-0 transition-all active:scale-[0.96]"
            >
              Push
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onPullClipboard}
            disabled={!isConnected}
            className="w-full rounded-full border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-xs font-semibold h-9 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ClipboardCopy className="h-3.5 w-3.5 text-zinc-500" />
            Pull Device Clipboard
          </Button>
        </div>
      </Card>

      {/* Encoders Card */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-2xl shadow-sm p-4">
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground">Available Encoders</h3>
            <p className="text-[10px] text-muted-foreground">
              Reported for active device.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRefreshEncoder}
            disabled={isFetchingEncoder || !isConnected}
            className="h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold px-3 cursor-pointer flex items-center"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1.5 text-zinc-500 ${isFetchingEncoder ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {isFetchingEncoder && !encoderSupport && (
          <div className="space-y-2 py-1">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="h-3.5 w-48 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded-full" />
          </div>
        )}

        {encoderSupport && (
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Video
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {encoderSupport.videoCodecs.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    No video encoders reported
                  </span>
                ) : (
                  encoderSupport.videoCodecs.map((codec) => (
                    <EncoderBadge
                      key={`v-${codec.codec}-${codec.encoderName}`}
                      codec={codec}
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Audio
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {encoderSupport.audioCodecs.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    No audio encoders reported
                  </span>
                ) : (
                  encoderSupport.audioCodecs.map((codec) => (
                    <EncoderBadge
                      key={`a-${codec.codec}-${codec.encoderName}`}
                      codec={codec}
                    />
                  ))
                )}
              </div>
            </div>

            <EncoderLegend />
          </div>
        )}
      </Card>
    </div>
  )
}
