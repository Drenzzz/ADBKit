import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sparkline } from '@/components/ui/sparkline'

interface StatTileProps {
  icon?: React.ReactNode
  label: string
  value: string
  sublabel?: string
  trend?: number[]
  trendColor?: string
  valueTone?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  onClick?: () => void
}

const valueToneColor: Record<NonNullable<StatTileProps['valueTone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: 'text-info',
}

function StatTile({
  icon,
  label,
  value,
  sublabel,
  trend,
  trendColor,
  valueTone = 'default',
  className,
  onClick,
}: StatTileProps) {
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-border/40 bg-muted/20 p-3 text-left transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/40 active:scale-[0.98]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40">
              {icon}
            </div>
          )}
          <span className="text-xs text-muted-foreground truncate">{label}</span>
        </div>
        <span className={cn('text-xs font-semibold tabular shrink-0', valueToneColor[valueTone])}>
          {value}
        </span>
      </div>

      {trend && trend.length >= 2 && (
        <Sparkline
          data={trend}
          height={22}
          width={120}
          color={trendColor ?? 'var(--primary)'}
          className="w-full mt-0.5"
        />
      )}

      {sublabel && (
        <span className="text-[10px] text-muted-foreground font-mono tabular">{sublabel}</span>
      )}
    </Wrapper>
  )
}

export { StatTile }
export type { StatTileProps }
