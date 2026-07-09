import { useQuery } from '@tanstack/react-query'
import { getRuntimeDiagnostics } from '@/services/settingsService'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

function BinaryVersions({ versions }: { versions: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Object.entries(versions).map(([key, value]) => {
        let display = value
        if (value.toLowerCase().includes('version')) {
          const matches = value.match(/version\s+([^\s]+)/i)
          if (matches) display = matches[1]
        } else if (value.toLowerCase().includes('scrcpy')) {
          const matches = value.match(/scrcpy\s+([^\s]+)/i)
          if (matches) display = `scrcpy ${matches[1]}`
        }
        return (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground capitalize">{key}</span>
            <span className="text-sm font-medium text-foreground tabular-nums">{display}</span>
          </div>
        )
      })}
    </div>
  )
}

function Capabilities({ capabilities }: { capabilities: Record<string, boolean> }) {
  const active = Object.entries(capabilities).filter(([, v]) => v)
  if (active.length === 0) {
    return <span className="text-sm text-muted-foreground">No capabilities detected</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map(([key]) => {
        const clean = key
          .replace('Available', '')
          .replace('Supported', '')
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {clean}
          </span>
        )
      })}
    </div>
  )
}

export function DiagnosticsPanel() {
  const query = useQuery({
    queryKey: ['settings', 'runtime-diagnostics'],
    queryFn: getRuntimeDiagnostics,
  })

  if (query.isLoading) {
    return (
      <Card className="rounded-2xl border border-border/50 bg-card/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (query.error || !query.data) {
    return (
      <Card className="rounded-2xl border border-border/50 bg-card/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-sm text-destructive">Failed to load diagnostics.</p>
        </CardContent>
      </Card>
    )
  }

  const data = query.data

  return (
    <Card className="rounded-2xl border border-border/50 bg-card/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Diagnostics
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-muted/30 p-3.5">
            <span className="text-xs font-medium text-muted-foreground">Binary Versions</span>
            <div className="mt-2">
              <BinaryVersions versions={data.binary_versions} />
            </div>
          </div>

          <div className="rounded-xl bg-muted/30 p-3.5">
            <span className="text-xs font-medium text-muted-foreground">Capabilities</span>
            <div className="mt-2">
              <Capabilities capabilities={data.capabilities} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
