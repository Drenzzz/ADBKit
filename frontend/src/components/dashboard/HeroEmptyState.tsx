import { Smartphone, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeroEmptyStateProps {
  refreshing: boolean
  onRefresh: () => void
}

export function HeroEmptyState({ refreshing, onRefresh }: HeroEmptyStateProps) {
  return (
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 border border-border/60 text-muted-foreground">
          <Smartphone className="h-8 w-8" />
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary/80" />
          </span>
        </div>
        <div className="max-w-sm space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            Awaiting Device Connection
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connect your Android device via USB cable with USB Debugging enabled, or use the Wireless Linker on the right.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs font-medium mt-2"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          Scan Devices
        </Button>
      </CardContent>
    </Card>
  )
}
