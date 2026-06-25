import { useState } from 'react'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { AUDIT_LOG_LIMIT_OPTIONS } from '@/services/settingsService'
import { selectSaveFile, selectFile } from '@/services/binaryService'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Filter,
  Info,
  RefreshCw,
  Trash2,
  Upload,
  XCircle,
  ScrollText,
} from 'lucide-react'

const LEVEL_ICON: Record<AuditLogLevel, React.ReactNode> = {
  info: <Info className="h-3 w-3" />,
  warning: <AlertTriangle className="h-3 w-3" />,
  error: <XCircle className="h-3 w-3" />,
  debug: <FileText className="h-3 w-3" />,
  success: <CheckCircle2 className="h-3 w-3" />,
}

const LEVEL_CLASS: Record<AuditLogLevel, string> = {
  info: 'text-blue-500 dark:text-blue-400',
  warning: 'text-amber-500 dark:text-amber-400',
  error: 'text-rose-500 dark:text-rose-400',
  debug: 'text-muted-foreground/80',
  success: 'text-emerald-500 dark:text-emerald-400',
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
    <div className="border-b border-zinc-150 dark:border-zinc-800/60 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'grid w-full grid-cols-12 gap-2 px-4 py-2.5 text-left text-[12px] transition-colors hover:bg-zinc-55 dark:hover:bg-zinc-900/30 cursor-pointer items-center',
          isOpen && 'bg-zinc-100/50 dark:bg-zinc-900/60',
        )}
      >
        <div
          className={cn(
            'col-span-2 flex items-center gap-1.5 capitalize font-semibold',
            LEVEL_CLASS[entry.level],
          )}
        >
          {LEVEL_ICON[entry.level]}
          {entry.level}
        </div>
        <div className="col-span-3 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
          {entry.operation}
        </div>
        <div className="col-span-4 truncate text-zinc-700 dark:text-zinc-300 font-medium">
          {entry.message}
        </div>
        <div className="col-span-2 truncate text-[11px] tabular-nums text-zinc-500 dark:text-zinc-500">
          {formatTimestamp(entry.timestamp)}
        </div>
        <div className="col-span-1 flex items-center justify-end gap-1.5">
          {entry.success ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
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
        <div className="border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 px-4 py-3">
          <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-1.5 text-xs">
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">ID</span>
            <span className="font-mono text-zinc-600 dark:text-zinc-400 break-all select-all">
              {entry.id}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Level</span>
            <span
              className={cn(
                'font-bold capitalize',
                LEVEL_CLASS[entry.level],
              )}
            >
              {entry.level}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Operation</span>
            <span className="font-mono text-zinc-600 dark:text-zinc-400">
              {entry.operation}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Time</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              {formatTimestamp(entry.timestamp)}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Message</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium break-words">
              {entry.message}
            </span>
            {entry.details && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Details</span>
                <pre className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap break-all">
                  {entry.details}
                </pre>
              </>
            )}
            {entry.duration && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Duration</span>
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
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
    auditLogLimit,
    selectedAuditLogId,
    availableOperations,
    setAuditLogFilters,
    setSelectedAuditLogId,
    loadAuditLogs,
    clearLogs,
    exportLogs,
    importLogs,
    changeLimit,
  } = useAuditLogs()

  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

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

  async function handleExport() {
    try {
      const path = await selectSaveFile('adbkit-audit-logs.json')
      if (!path) return
      const ok = await exportLogs(path)
      if (ok) {
        toast.success('Audit logs exported', { description: path })
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Export failed',
      )
    }
  }

  async function handleImport() {
    try {
      const path = await selectFile()
      if (!path) return
      setShowImportDialog(false)
      const count = await importLogs(path)
      if (count !== null) {
        toast.success(`Imported ${count} entries`, { description: path })
        void loadAuditLogs()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Import failed',
      )
    }
  }

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0b10]/40 rounded-2xl shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3 border-b border-zinc-150/80 dark:border-zinc-800/80">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ScrollText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          Audit Logs
        </CardTitle>
        
        {/* Actions Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={auditLogs.length === 0}
            className="h-8 rounded-full text-xs font-semibold cursor-pointer"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            className="h-8 rounded-full text-xs font-semibold cursor-pointer"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadAuditLogs()}
            disabled={loadingAuditLogs}
            className="h-8 rounded-full text-xs font-semibold cursor-pointer"
          >
            <RefreshCw
              className={cn(
                'mr-1.5 h-3.5 w-3.5',
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
            className="h-8 rounded-full text-xs font-semibold cursor-pointer text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-zinc-200 dark:border-zinc-800"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-5">
        {error && (
          <p className="text-xs text-rose-500 font-semibold">{error}</p>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3 bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
          {/* Search */}
          <div className="flex-grow min-w-[200px]">
            <Input
              placeholder="Search logs..."
              value={auditLogFilters.text}
              onChange={(event) =>
                setAuditLogFilters({ text: event.target.value })
              }
              className="h-8 rounded-full font-mono text-xs pl-3 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* Outcome select */}
          <Select
            value={auditLogFilters.outcome}
            onValueChange={(value) =>
              setAuditLogFilters({
                outcome: value as 'all' | 'succeeded' | 'failed',
              })
            }
          >
            <SelectTrigger className="h-8 w-auto min-w-[125px] rounded-full text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:ring-0">
              <SelectValue placeholder="All outcomes" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
              <SelectItem value="all" className="text-xs cursor-pointer">All outcomes</SelectItem>
              <SelectItem value="succeeded" className="text-xs cursor-pointer">Succeeded</SelectItem>
              <SelectItem value="failed" className="text-xs cursor-pointer">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Operation select */}
          <Select
            value={auditLogFilters.operation || ALL_OPERATIONS_VALUE}
            onValueChange={(value) =>
              setAuditLogFilters({
                operation: value === ALL_OPERATIONS_VALUE ? '' : (value ?? ''),
              })
            }
          >
            <SelectTrigger className="h-8 w-auto min-w-[130px] max-w-[180px] rounded-full text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:ring-0">
              <SelectValue placeholder="All operations" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 max-h-[240px]">
              <SelectItem value={ALL_OPERATIONS_VALUE} className="text-xs cursor-pointer">All operations</SelectItem>
              {availableOperations.map((op) => (
                <SelectItem key={op} value={op} className="text-xs cursor-pointer">
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Limit select */}
          <Select
            value={String(auditLogLimit)}
            onValueChange={(value) => changeLimit(Number(value))}
          >
            <SelectTrigger className="h-8 w-auto min-w-[105px] rounded-full text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:ring-0">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
              {AUDIT_LOG_LIMIT_OPTIONS.map((value) => (
                <SelectItem key={value} value={String(value)} className="text-xs cursor-pointer">
                  {value} entries
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Level Chips Toggles */}
          <div className="flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-0.5">
            {ALL_LEVELS.map((level) => {
              const isActive = auditLogFilters.levels.includes(level)
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize transition-colors cursor-pointer',
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-foreground'
                      : 'text-muted-foreground/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 hover:text-foreground',
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

          {/* Sort Toggles */}
          <div className="flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-0.5">
            {(
              [
                { value: 'newest', label: 'Newest' },
                { value: 'oldest', label: 'Oldest' },
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
                    'rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors cursor-pointer',
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-foreground'
                      : 'text-muted-foreground/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Logs Table Area */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            <div className="col-span-2">Level</div>
            <div className="col-span-3">Operation</div>
            <div className="col-span-4">Message</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-1 text-right">Result</div>
          </div>

          <div className="max-h-[350px] overflow-y-auto divide-y divide-zinc-150/40 dark:divide-zinc-800/40">
            {loadingAuditLogs ? (
              <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-8 w-full rounded-full animate-pulse" />
                <Skeleton className="h-8 w-full rounded-full animate-pulse" />
                <Skeleton className="h-8 w-full rounded-full animate-pulse" />
                <Skeleton className="h-8 w-full rounded-full animate-pulse" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Filter className="mb-2 h-6 w-6 text-muted-foreground/30" />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  No matching logs
                </span>
                <span className="mt-1 text-[10px] text-muted-foreground/60 text-center px-6 leading-relaxed">
                  {auditLogFilters.levels.length < ALL_LEVELS.length ||
                  auditLogFilters.operation ||
                  auditLogFilters.text ||
                  auditLogFilters.outcome !== 'all' ||
                  auditLogFilters.sort !== 'newest'
                    ? 'Adjust the filters above to expand your search.'
                    : 'System activity logs will accumulate as operations execute.'}
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

        {/* Footer info stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] font-medium text-muted-foreground/80 pt-1">
          <span>
            Showing {filteredLogs.length} of {auditLogs.length} entries (limit {auditLogLimit})
          </span>
          <span>Backend buffer max 1000 entries — use Export to back up history</span>
        </div>
      </CardContent>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all audit logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all audit log entries from local storage (
              {auditLogs.length} total). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0">
              Clear logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Import audit logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current audit log with the contents of
              the selected JSON file. The backend keeps at most 1000
              entries — anything beyond that will be dropped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport} className="rounded-full bg-primary hover:bg-primary/95 text-primary-foreground border-0">
              Select file and import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
