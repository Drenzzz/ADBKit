import { useState } from 'react'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { AuditLogEntry, AuditLogLevel } from '@/lib/types'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Filter,
  Info,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'

const LEVEL_ICON: Record<AuditLogLevel, React.ReactNode> = {
  info: <Info className="h-3 w-3" />,
  warning: <AlertTriangle className="h-3 w-3" />,
  error: <XCircle className="h-3 w-3" />,
  debug: <FileText className="h-3 w-3" />,
  success: <CheckCircle2 className="h-3 w-3" />,
}

const LEVEL_CLASS: Record<AuditLogLevel, string> = {
  info: 'text-blue-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
  debug: 'text-muted-foreground',
  success: 'text-emerald-400',
}

const ALL_LEVELS: AuditLogLevel[] = ['info', 'warning', 'error', 'debug', 'success']

const ALL_OPERATIONS_VALUE = '__all__'

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return date.toLocaleString()
}

interface AuditRowProps {
  entry: AuditLogEntry
  isOpen: boolean
  onToggle: () => void
}

function AuditRow({ entry, isOpen, onToggle }: AuditRowProps) {
  return (
    <div className="border-b border-border/20 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'grid w-full grid-cols-12 gap-2 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-accent/30',
          isOpen && 'bg-accent/40',
        )}
      >
        <div
          className={cn(
            'col-span-2 flex items-center gap-1.5 capitalize',
            LEVEL_CLASS[entry.level],
          )}
        >
          {LEVEL_ICON[entry.level]}
          {entry.level}
        </div>
        <div className="col-span-3 truncate font-mono text-xs text-muted-foreground">
          {entry.operation}
        </div>
        <div className="col-span-4 truncate text-muted-foreground/80">
          {entry.message}
        </div>
        <div className="col-span-2 truncate text-xs tabular-nums text-muted-foreground/60">
          {formatTimestamp(entry.timestamp)}
        </div>
        <div className="col-span-1 flex items-center justify-end gap-1.5">
          {entry.success ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-red-400" />
          )}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground/50 transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/20 bg-muted/20 px-4 py-3">
          <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 text-xs">
            <span className="text-muted-foreground/60">ID</span>
            <span className="font-mono text-muted-foreground break-all">
              {entry.id}
            </span>
            <span className="text-muted-foreground/60">Level</span>
            <span
              className={cn(
                'font-medium capitalize',
                LEVEL_CLASS[entry.level],
              )}
            >
              {entry.level}
            </span>
            <span className="text-muted-foreground/60">Operation</span>
            <span className="font-mono text-muted-foreground">
              {entry.operation}
            </span>
            <span className="text-muted-foreground/60">Time</span>
            <span className="text-muted-foreground">
              {formatTimestamp(entry.timestamp)}
            </span>
            <span className="text-muted-foreground/60">Message</span>
            <span className="text-muted-foreground break-words">
              {entry.message}
            </span>
            {entry.details && (
              <>
                <span className="text-muted-foreground/60">Details</span>
                <pre className="rounded-md bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground/80 whitespace-pre-wrap break-all">
                  {entry.details}
                </pre>
              </>
            )}
            {entry.duration && (
              <>
                <span className="text-muted-foreground/60">Duration</span>
                <span className="font-mono text-muted-foreground">
                  {entry.duration}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AuditLogsPanel() {
  const {
    filteredLogs,
    loadingAuditLogs,
    clearingAuditLogs,
    error,
    auditLogFilters,
    auditLogs,
    selectedAuditLogId,
    availableOperations,
    setAuditLogFilters,
    setSelectedAuditLogId,
    loadAuditLogs,
    clearLogs,
  } = useAuditLogs()

  const [showClearDialog, setShowClearDialog] = useState(false)

  function toggleLevel(level: AuditLogLevel) {
    const current = auditLogFilters.levels
    const next = current.includes(level)
      ? current.filter((value) => value !== level)
      : [...current, level]
    setAuditLogFilters({ levels: next })
  }

  function handleClear() {
    clearLogs().then((ok) => {
      if (ok) setShowClearDialog(false)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Filter
        </span>

        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border/40 p-1">
          {ALL_LEVELS.map((level) => {
            const isActive = auditLogFilters.levels.includes(level)
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                className={cn(
                  'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium capitalize transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground/60 hover:bg-accent/40 hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-40',
                  )}
                >
                  {LEVEL_ICON[level]}
                </span>
                {level}
              </button>
            )
          })}
        </div>

        <Select
          value={auditLogFilters.outcome}
          onValueChange={(value) =>
            setAuditLogFilters({
              outcome: value as 'all' | 'succeeded' | 'failed',
            })
          }
        >
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
            <SelectValue placeholder="All outcomes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="succeeded">Succeeded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={auditLogFilters.operation || ALL_OPERATIONS_VALUE}
          onValueChange={(value) =>
            setAuditLogFilters({
              operation: value === ALL_OPERATIONS_VALUE ? '' : (value ?? ''),
            })
          }
        >
          <SelectTrigger className="h-8 w-auto min-w-[140px] max-w-[200px] text-xs">
            <SelectValue placeholder="All operations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPERATIONS_VALUE}>All operations</SelectItem>
            {availableOperations.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search logs..."
          value={auditLogFilters.text}
          onChange={(event) =>
            setAuditLogFilters({ text: event.target.value })
          }
          className="h-8 min-w-[180px] flex-1 font-mono text-xs"
        />

        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Sort
        </span>

        <div className="flex items-center gap-1 rounded-md border border-border/40 p-1">
          {(
            [
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
            ] as const
          ).map((option) => {
            const isActive = auditLogFilters.sort === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setAuditLogFilters({ sort: option.value })
                }
                className={cn(
                  'rounded px-2 py-1 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground/60 hover:bg-accent/40 hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadAuditLogs()}
            disabled={loadingAuditLogs}
            className="h-8"
          >
            <RefreshCw
              className={cn(
                'mr-1.5 h-3 w-3',
                loadingAuditLogs && 'animate-spin',
              )}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowClearDialog(true)}
            disabled={clearingAuditLogs || auditLogs.length === 0}
            className="h-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3 w-3" />
            Clear
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/40">
        <div className="grid grid-cols-12 gap-2 border-b border-border/30 bg-muted/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          <div className="col-span-2">Level</div>
          <div className="col-span-3">Operation</div>
          <div className="col-span-4">Message</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-1 text-right">Result</div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loadingAuditLogs ? (
            <div className="flex flex-col gap-1 p-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Filter className="mb-2 h-6 w-6 text-muted-foreground/30" />
              <span className="text-sm text-muted-foreground/60">
                No matching logs
              </span>
              <span className="mt-1 text-[11px] text-muted-foreground/40">
                {auditLogFilters.levels.length < ALL_LEVELS.length ||
                auditLogFilters.operation ||
                auditLogFilters.text ||
                auditLogFilters.outcome !== 'all' ||
                auditLogFilters.sort !== 'newest'
                  ? 'Try adjusting the filters above.'
                  : 'Audit logs will appear here as operations run.'}
              </span>
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <AuditRow
                key={entry.id}
                entry={entry}
                isOpen={entry.id === selectedAuditLogId}
                onToggle={() =>
                  setSelectedAuditLogId(
                    entry.id === selectedAuditLogId ? null : entry.id,
                  )
                }
              />
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground/50">
        <span>
          {filteredLogs.length} of {auditLogs.length} entries
        </span>
        <span>Limit {auditLogs.length} per fetch</span>
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all audit logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all audit log entries from local storage (
              {auditLogs.length} total). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear}>
              Clear logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
