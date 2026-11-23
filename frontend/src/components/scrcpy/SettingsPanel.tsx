import { useState } from 'react'
import {
  IconClipboardCopy as ClipboardCopy,
  IconRefresh as RefreshCw
} from "@tabler/icons-react"
import type { ScrcpyEncoderSupport } from '@/lib/types'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { EncoderRow, EncoderLegend } from '@/components/scrcpy/EncoderBadge'

interface ClipboardPanelProps {
  onPushClipboard: (text: string) => void
  onPullClipboard: () => void
  isConnected: boolean
}

export function ClipboardPanel({ onPushClipboard, onPullClipboard, isConnected }: ClipboardPanelProps) {
  const [clipboardDraft, setClipboardDraft] = useState('')

  function push() {
    if (!clipboardDraft) return
    onPushClipboard(clipboardDraft)
    setClipboardDraft('')
  }

  return (
    <section className="m3-surface flex flex-col gap-4 rounded-3xl p-5">
      <div>
        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Clipboard sync</h3>
        <p className="mt-0.5 text-[14px] text-[var(--color-text-secondary)]">
          Two-way clipboard between host and device
        </p>
      </div>

      <div className="relative flex items-center">
        <input
          id="clipboard-draft"
          value={clipboardDraft}
          onChange={(e) => setClipboardDraft(e.target.value)}
          placeholder="Text to send to device"
          aria-label="Text to send to device"
          disabled={!isConnected}
          className="h-12 w-full rounded-full bg-[var(--color-surface-inset)] pl-5 pr-24 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && clipboardDraft && isConnected) push()
          }}
        />
        <button
          type="button"
          onClick={push}
          disabled={!clipboardDraft || !isConnected}
          className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full bg-[var(--color-accent)] px-5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          Push
        </button>
      </div>

      <button
        type="button"
        onClick={onPullClipboard}
        disabled={!isConnected}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border/50 text-[15px] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
      >
        <ClipboardCopy size={18} stroke={1.75} className="text-[var(--color-text-secondary)]" />
        Pull device clipboard
      </button>
    </section>
  )
}

interface EncodersPanelProps {
  encoderSupport: ScrcpyEncoderSupport | null
  isFetchingEncoder: boolean
  onRefreshEncoder: () => void
  isConnected: boolean
}

export function EncodersPanel({
  encoderSupport,
  isFetchingEncoder,
  onRefreshEncoder,
  isConnected,
}: EncodersPanelProps) {
  return (
    <section className="m3-surface flex flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Available encoders</h3>
          <p className="mt-0.5 text-[14px] text-[var(--color-text-secondary)]">Reported for the active device</p>
        </div>
        <button
          type="button"
          aria-label="Refresh encoders"
          onClick={onRefreshEncoder}
          disabled={isFetchingEncoder || !isConnected}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          <RefreshCw size={18} stroke={1.75} className={isFetchingEncoder ? 'animate-spin motion-reduce:animate-none' : undefined} />
        </button>
      </div>

      {isFetchingEncoder && !encoderSupport && (
        <div className="space-y-2 py-1">
          <Skeleton height={40} width="100%" radius={4} />
          <Skeleton height={40} width="100%" radius={4} />
          <Skeleton height={40} width="66.666667%" radius={4} />
        </div>
      )}

      {!isFetchingEncoder && !encoderSupport && (
        <p className="rounded-2xl border-2 border-dashed border-border/40 px-4 py-6 text-center text-[14px] text-[var(--color-text-secondary)]">
          {isConnected ? 'No encoder report yet' : 'Connect a device to list its encoders'}
        </p>
      )}

      {encoderSupport && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-[14px] font-semibold text-[var(--color-text-secondary)]">Video encoders</p>
            <div className="flex flex-col gap-0.5">
              {encoderSupport.videoCodecs.length === 0 ? (
                <span className="px-3 py-2 text-[14px] text-[var(--color-text-secondary)]">No video encoders reported</span>
              ) : (
                encoderSupport.videoCodecs.map((codec) => (
                  <EncoderRow key={`v-${codec.codec}-${codec.encoderName}`} codec={codec} />
                ))
              )}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[14px] font-semibold text-[var(--color-text-secondary)]">Audio encoders</p>
            <div className="flex flex-col gap-0.5">
              {encoderSupport.audioCodecs.length === 0 ? (
                <span className="px-3 py-2 text-[14px] text-[var(--color-text-secondary)]">No audio encoders reported</span>
              ) : (
                encoderSupport.audioCodecs.map((codec) => (
                  <EncoderRow key={`a-${codec.codec}-${codec.encoderName}`} codec={codec} />
                ))
              )}
            </div>
          </div>

          <EncoderLegend />
        </div>
      )}
    </section>
  )
}