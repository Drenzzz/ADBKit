import { useQuery } from '@tanstack/react-query'
import { getRuntimeDiagnostics } from '@/services/settingsService'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Box, Cpu, Database, FileCode, Folder, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  value: ReactNode
  mono?: boolean
}

function Field({ label, value, mono }: FieldProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border/40 bg-card px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      <span className={`text-sm ${mono ? 'font-mono break-all' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function CapabilitiesList({ caps }: { caps: Record<string, boolean> }) {
  const entries = Object.entries(caps)
  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground/60">No data</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <Badge
          key={key}
          variant={value ? 'default' : 'outline'}
          className="text-[10px]"
        >
          {key}: {value ? 'on' : 'off'}
        </Badge>
      ))}
    </div>
  )
}

function BinaryVersionsList({ versions }: { versions: Record<string, string> }) {
  const entries = Object.entries(versions)
  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground/60">No data</span>
  }
  return (
    <div className="flex flex-col gap-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">{key}</span>
          <span className="font-mono">{value}</span>
        </div>
      ))}
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    )
  }

  if (query.error || !query.data) {
    return (
      <p className="text-sm text-destructive">Failed to load diagnostics.</p>
    )
  }

  const data = query.data

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Operating System"
          value={data.os}
        />
        <Field
          label="Architecture"
          value={data.arch}
        />
        <Field
          label="Theme"
          value={data.theme === 'light' ? 'Light' : 'Dark'}
        />
        <Field
          label="Setup completed"
          value={data.setup_completed ? 'Yes' : 'No'}
        />
        <Field
          label="Data directory"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Database className="h-3 w-3 text-muted-foreground" />
              {data.data_dir}
            </span>
          }
          mono
        />
        <Field
          label="Config path"
          value={
            <span className="inline-flex items-center gap-1.5">
              <FileCode className="h-3 w-3 text-muted-foreground" />
              {data.config_path}
            </span>
          }
          mono
        />
        <Field
          label="Managed binary dir"
          value={
            data.managed_binary_dir ? (
              <span className="inline-flex items-center gap-1.5">
                <Folder className="h-3 w-3 text-muted-foreground" />
                {data.managed_binary_dir}
              </span>
            ) : (
              <span className="text-muted-foreground/60">—</span>
            )
          }
          mono
        />
        <Field
          label="Binary versions"
          value={<BinaryVersionsList versions={data.binary_versions} />}
        />
        <Field
          label="Capabilities"
          value={<CapabilitiesList caps={data.capabilities} />}
        />
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Box className="h-3.5 w-3.5" />
        <span>
          {data.os}/{data.arch}
        </span>
        <Cpu className="ml-2 h-3.5 w-3.5" />
        <span>Wails v2 desktop</span>
        <Wrench className="ml-2 h-3.5 w-3.5" />
        <span>v2.0 Full</span>
      </div>
    </div>
  )
}
