import { useState } from 'react'
import { ClipboardCopy, ClipboardPaste, RefreshCw } from 'lucide-react'
import type { ScrcpyEncoderSupport } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

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
    <div className="space-y-5">
      <Card className="border-border/50 bg-background/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Encoder support</h3>
            <p className="text-xs text-muted-foreground">
              Reported by scrcpy --list-encoders for the active device.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRefreshEncoder}
            disabled={isFetchingEncoder || !isConnected}
            className="gap-2"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetchingEncoder ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {isFetchingEncoder && !encoderSupport && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        )}

        {encoderSupport && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Video
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {encoderSupport.videoCodecs.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    No video encoders reported
                  </span>
                ) : (
                  encoderSupport.videoCodecs.map((codec) => (
                    <Badge
                      key={`v-${codec.codec}-${codec.encoderName}`}
                      variant="secondary"
                      className="gap-1"
                    >
                      <span className="font-mono">{codec.codec}</span>
                      <span className="text-muted-foreground">
                        ({codec.encoderName})
                      </span>
                      {codec.hardware && (
                        <span className="rounded bg-emerald-500/20 px-1 text-[10px] text-emerald-400">
                          HW
                        </span>
                      )}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Audio
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {encoderSupport.audioCodecs.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    No audio encoders reported
                  </span>
                ) : (
                  encoderSupport.audioCodecs.map((codec) => (
                    <Badge
                      key={`a-${codec.codec}-${codec.encoderName}`}
                      variant="secondary"
                      className="gap-1"
                    >
                      <span className="font-mono">{codec.codec}</span>
                      <span className="text-muted-foreground">
                        ({codec.encoderName})
                      </span>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="border-border/50 bg-background/50 p-4">
        <h3 className="mb-1 text-sm font-semibold">Clipboard sync</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Two-way clipboard between host and device via adb cmd clipboard.
        </p>

        <div className="space-y-2">
          <Label htmlFor="clipboard-draft" className="text-xs">
            Push to device
          </Label>
          <div className="flex gap-2">
            <Input
              id="clipboard-draft"
              value={clipboardDraft}
              onChange={(e) => setClipboardDraft(e.target.value)}
              placeholder="Text to send to the device"
            />
            <Button
              type="button"
              onClick={() => {
                if (!clipboardDraft) return
                onPushClipboard(clipboardDraft)
              }}
              disabled={!clipboardDraft || !isConnected}
              className="gap-2"
            >
              <ClipboardPaste className="h-4 w-4" />
              Push
            </Button>
          </div>
        </div>

        <Separator className="my-3" />

        <Button
          type="button"
          variant="outline"
          onClick={onPullClipboard}
          disabled={!isConnected}
          className="w-full gap-2"
        >
          <ClipboardCopy className="h-4 w-4" />
          Pull device clipboard
        </Button>
      </Card>
    </div>
  )
}
