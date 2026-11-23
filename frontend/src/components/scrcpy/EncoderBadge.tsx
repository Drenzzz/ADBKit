import type { ScrcpyCodecSupport } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MarqueeText } from './MarqueeText'

export function encoderTooltip(codec: {
  hardware: boolean
  vendor: boolean
  softwareOnly: boolean
  aliasOf: string
  encoderName: string
}): string {
  if (codec.aliasOf) {
    return `OMX alias, routes to ${codec.aliasOf}`
  }
  if (codec.hardware && codec.vendor) {
    return `Vendor-specific hardware encoder, best performance`
  }
  if (codec.hardware) {
    return `Hardware-accelerated, low CPU usage`
  }
  return `Software encoder, CPU-intensive, works everywhere`
}

export function EncoderRow({ codec }: { codec: ScrcpyCodecSupport }) {
  const isAlias = codec.aliasOf && codec.aliasOf.length > 0
  return (
    <div
      title={encoderTooltip(codec)}
      className={cn(
        'flex flex-col gap-1 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-background-card)]/60',
        isAlias && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('shrink-0 font-mono text-[15px] font-semibold text-[var(--color-text-primary)]', isAlias && 'line-through')}>
          {codec.codec}
        </span>
        {codec.recommended && !isAlias && (
          <span className="ml-auto shrink-0 text-[14px] font-semibold text-[var(--color-accent)]">Recommended</span>
        )}
        {!isAlias && (
          <span
            className={cn(
              'shrink-0 text-[14px] font-semibold',
              !codec.recommended && 'ml-auto',
              codec.hardware ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]',
            )}
          >
            {codec.hardware ? 'HW' : 'SW'}
          </span>
        )}
      </div>
      <MarqueeText
        title={codec.encoderName}
        className={cn('font-mono text-[13px] text-[var(--color-text-secondary)]', isAlias && 'line-through')}
      >
        {codec.encoderName}
      </MarqueeText>
    </div>
  )
}

export function EncoderLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
      <span>
        <span className="font-semibold text-[var(--color-success)]">HW</span> hardware
      </span>
      <span>
        <span className="font-semibold">SW</span> software
      </span>
      <span>
        <span className="font-semibold text-[var(--color-accent)]">Recommended</span> best pick
      </span>
      <span>Strikethrough = OMX alias (auto-routed)</span>
    </p>
  )
}