import { Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDevices } from '@/hooks/useDevices'

export function DeviceInfoCard() {
  const { activeSerial, deviceInfo, loading, refreshDevices } = useDevices()

  const infoItems = deviceInfo
    ? [
        { label: 'Android Version', value: deviceInfo.androidVersion },
        { label: 'SDK API Level', value: deviceInfo.sdkVersion },
        { label: 'Build Identifier', value: deviceInfo.buildId },
        { label: 'Security Patch', value: deviceInfo.securityPatch },
        { label: 'CPU Architecture', value: deviceInfo.abis },
        { label: 'Manufacturer', value: deviceInfo.manufacturer },
      ]
    : []

  return (
    <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          <Info className="h-3.5 w-3.5" />
          Device Specifications
        </CardTitle>
        {activeSerial && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={refreshDevices}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading && !deviceInfo ? (
          <div className="space-y-3.5 py-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : !deviceInfo ? (
          <p className="text-xs text-muted-foreground py-2 text-center">No active device details.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {infoItems.map((item) => (
              <div key={item.label} className="flex justify-between py-2 text-xs">
                <span className="text-muted-foreground font-medium">{item.label}</span>
                <span className="text-foreground font-mono font-medium truncate max-w-[65%]" title={item.value}>
                  {item.value || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
