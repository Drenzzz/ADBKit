import { Smartphone } from 'lucide-react'

export function NoDeviceEmptyState({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="relative mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 border border-border/40">
          <Smartphone className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/30" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">No device connected</h3>
      <p className="text-xs text-muted-foreground/60 max-w-[260px] leading-relaxed">
        Connect an Android device via USB or wireless to use {feature}.
      </p>
    </div>
  )
}
