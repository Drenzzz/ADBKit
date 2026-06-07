import type { ScrcpyCodecSupport } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
    return `Vendor-specific hardware encoder — best performance`
  }
  if (codec.hardware) {
    return `Hardware-accelerated — low CPU usage`
  }
  return `Software encoder — CPU-intensive, works everywhere`
}

export function EncoderBadge({ codec }: { codec: ScrcpyCodecSupport }) {
  const isAlias = codec.aliasOf && codec.aliasOf.length > 0
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Badge
            {...props}
            variant={codec.recommended ? 'default' : 'secondary'}
            className={`gap-1 ${codec.recommended ? 'border-primary/50' : ''} ${
              isAlias ? 'opacity-50 line-through' : ''
            }`}
          >
            <span className="font-mono">{codec.codec}</span>
            <span className="text-muted-foreground">({codec.encoderName})</span>
            {codec.hardware && !isAlias && (
              <span className="rounded bg-emerald-500/20 px-1 text-[10px] text-emerald-400">
                HW
              </span>
            )}
            {!codec.hardware && !isAlias && (
              <span className="rounded bg-zinc-500/20 px-1 text-[10px] text-muted-foreground">
                SW
              </span>
            )}
            {codec.recommended && !isAlias && (
              <span className="rounded bg-primary/20 px-1 text-[10px] text-primary-foreground">
                ★
              </span>
            )}
          </Badge>
        )}
      />
      <TooltipContent>{encoderTooltip(codec)}</TooltipContent>
    </Tooltip>
  )
}
