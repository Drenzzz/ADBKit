import { useQuery } from '@tanstack/react-query'
import { getRuntimeDiagnostics } from '@/services/settingsService'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export function DiagnosticsPanel() {
  const query = useQuery({
    queryKey: ['settings', 'runtime-diagnostics'],
    queryFn: getRuntimeDiagnostics,
  })

  if (query.isLoading) {
    return (
      <Card className="border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/40 rounded-2xl shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Activity className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
            Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (query.error || !query.data) {
    return (
      <Card className="border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/40 rounded-2xl shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Activity className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
            Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <p className="text-xs text-[var(--destructive)] font-semibold">Failed to load diagnostics.</p>
        </CardContent>
      </Card>
    )
  }

  const data = query.data

  return (
    <Card className="border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/40 rounded-2xl shadow-[var(--shadow-card)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
          Diagnostics
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Column 1: System Info */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/30 dark:bg-[var(--muted)]/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
              System info
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS:</span>
                <span className="font-semibold text-foreground dark:text-foreground">{data.os} ({data.arch})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Theme:</span>
                <span className="font-semibold text-foreground dark:text-foreground">{data.theme === 'light' ? 'Light' : 'Dark'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Setup:</span>
                <span className="font-semibold text-foreground dark:text-foreground">{data.setup_completed ? 'Completed' : 'Pending'}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Paths & Directories */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/30 dark:bg-[var(--muted)]/10 justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
              Paths & Directories
            </span>
            <div className="space-y-1.5 text-[10px] font-mono leading-tight">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[8px] font-sans font-bold uppercase">Data directory</span>
                <span className="truncate text-foreground dark:text-foreground" title={data.data_dir}>{data.data_dir}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[8px] font-sans font-bold uppercase">Config file</span>
                <span className="truncate text-foreground dark:text-foreground" title={data.config_path}>{data.config_path}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Binary Versions */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/30 dark:bg-[var(--muted)]/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
              Binary versions
            </span>
            <div className="space-y-1 text-xs">
              {Object.entries(data.binary_versions).map(([key, value]) => {
                let display = value
                if (value.toLowerCase().includes('version')) {
                  const matches = value.match(/version\s+([^\s]+)/i)
                  if (matches) display = matches[1]
                } else if (value.toLowerCase().includes('scrcpy')) {
                  const matches = value.match(/scrcpy\s+([^\s]+)/i)
                  if (matches) display = `scrcpy ${matches[1]}`
                }
                return (
                  <div key={key} className="flex justify-between font-mono text-[10px]">
                    <span className="capitalize text-muted-foreground font-sans">{key}:</span>
                    <span className="font-semibold text-foreground dark:text-foreground">{display}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Column 4: Capabilities */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-[var(--muted)]/30 dark:bg-[var(--muted)]/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
              Capabilities
            </span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {Object.entries(data.capabilities).map(([key, value]) => {
                if (!value) return null
                const cleanKey = key
                  .replace('Available', '')
                  .replace('Supported', '')
                return (
                  <Badge
                    key={key}
                    variant="default"
                    className="text-[9px] px-1.5 py-0 rounded bg-[var(--success)]/10 text-[var(--success)] dark:bg-[var(--success)]/20 dark:text-[var(--success)] border-0 font-semibold"
                  >
                    {cleanKey}
                  </Badge>
                )
              })}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
