import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Selector } from '@astryxdesign/core/Selector'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { AlertDialog } from '@astryxdesign/core/AlertDialog'
import { cn } from '@/lib/utils'
import type { AuditLogEntry, AuditLogLevel } from '@/lib/types'
import { AUDIT_LOG_LIMIT_OPTIONS } from '@/services/settingsService'
import { selectSaveFile, selectFile } from '@/services/binaryService'
import { toast } from '@/lib/toast'
import { SettingsSection } from './SettingsSection'
import {
  IconAlertTriangle as AlertTriangle,
  IconCircleCheck as CheckCircle2,
  IconChevronDown as ChevronDown,
  IconDownload as Download,
  IconFileText as FileText,
  IconFilter as Filter,
  IconInfoCircle as Info,
  IconRefresh as RefreshCw,
  IconTrash as Trash2,
  IconUpload as Upload,
  IconCircleXFilled as XCircle,
  IconArticle as ScrollText
} from "@tabler/icons-react"

const LEVEL_ICON: Record<AuditLogLevel, React.ReactNode> = {
  info: <Info size={16} stroke={1.75} />,
  warning: <AlertTriangle size={16} stroke={1.75} />,
  error: <XCircle size={16} stroke={1.75} />,
  debug: <FileText size={16} stroke={1.75} />,
  success: <CheckCircle2 size={16} stroke={1.75} />,
}

const LEVEL_CLASS: Record<AuditLogLevel, string> = {
  info: 'text-[var(--logcat-info)]',
  warning: 'text-[var(--color-warning)]',
  error: 'text-[var(--color-error)]',
  debug: 'text-[var(--color-text-secondary)]',
  success: 'text-[var(--color-success)]',
}

const ALL_LEVELS: AuditLogLevel[] = ['info', 'warning', 'error', 'debug', 'success']
const ALL_OPERATIONS_VALUE = '__all__'

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return date.toLocaleString()
}

const outlineButton =
  'flex h-10 items-center gap-2 rounded-full border border-border/50 px-4 text-[14px] font-semibold text-[var(--color-text-primary)] transition-[background-color,opacity] duration-150 hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none'

interface AuditRowProps {
  entry: AuditLogEntry
  isOpen: boolean
  onToggle: () => void
}

function AuditRow({ entry, isOpen, onToggle }: AuditRowProps) {
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          'grid w-full grid-cols-12 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--color-background-card)]/40 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
          isOpen && 'bg-[var(--color-background-card)]/50',
        )}
      >
        <div className={cn('col-span-2 flex items-center gap-2 text-[14px] font-semibold', LEVEL_CLASS[entry.level])}>
          {LEVEL_ICON[entry.level]}
          {entry.level}
        </div>
        <div className="col-span-3 truncate font-mono text-[13px] text-[var(--color-text-secondary)]">
          {entry.operation}
        </div>
        <div className="col-span-4 truncate text-[14px] font-medium text-[var(--color-text-primary)]">
          {entry.message}
        </div>
        <div className="col-span-2 truncate font-mono text-[13px] text-[var(--color-text-secondary)] tabular-nums">
          {formatTimestamp(entry.timestamp)}
        </div>
        <div className="col-span-1 flex items-center justify-end gap-1.5">
          {entry.success ? (
            <CheckCircle2 size={16} stroke={1.75} className="text-[var(--color-success)]" />
          ) : (
            <XCircle size={16} stroke={1.75} className="text-[var(--color-error)]" />
          )}
          <ChevronDown
            size={16}
            stroke={1.75}
            className={cn('text-[var(--color-text-secondary)] transition-transform duration-200 motion-reduce:transition-none', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {isOpen && (
        <div className="m3-inset mx-4 mb-3 grid grid-cols-[100px_1fr] gap-x-3 gap-y-1.5 p-4 text-[14px]">
          <span className="font-medium text-[var(--color-text-secondary)]">ID</span>
          <span className="break-all font-mono text-[13px] text-[var(--color-text-primary)] select-all">
            {entry.id}
          </span>
          <span className="font-medium text-[var(--color-text-secondary)]">Level</span>
          <span className={cn('font-semibold', LEVEL_CLASS[entry.level])}>{entry.level}</span>
          <span className="font-medium text-[var(--color-text-secondary)]">Operation</span>
          <span className="font-mono text-[13px] text-[var(--color-text-primary)]">{entry.operation}</span>
          <span className="font-medium text-[var(--color-text-secondary)]">Time</span>
          <span className="font-mono text-[13px] text-[var(--color-text-primary)]">
            {formatTimestamp(entry.timestamp)}
          </span>
          <span className="font-medium text-[var(--color-text-secondary)]">Message</span>
          <span className="break-words text-[var(--color-text-primary)]">{entry.message}</span>
          {entry.details && (
            <>
              <span className="font-medium text-[var(--color-text-secondary)]">Details</span>
              <pre className="break-all whitespace-pre-wrap rounded-xl border border-border/40 bg-[var(--color-background-card)] p-3 font-mono text-[13px] text-[var(--color-text-primary)]">
                {entry.details}
              </pre>
            </>
          )}
          {entry.duration && (
            <>
              <span className="font-medium text-[var(--color-text-secondary)]">Duration</span>
              <span className="font-mono text-[13px] text-[var(--color-text-primary)]">{entry.duration}</span>
            </>
          )}
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

  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 8,
    // Measurements must follow the entry, not its position: reordering (Newest/Oldest)
    // with index keys corrupts the size cache and leaves stale rows rendered.
    getItemKey: (index) => filteredLogs[index]?.id ?? index,
  })

  // Expanded rows change height, so the cached measurements must be dropped.
  useEffect(() => {
    virtualizer.measure()
  }, [selectedAuditLogId, auditLogFilters.sort, virtualizer])

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
    <SettingsSection
      icon={<ScrollText size={20} stroke={1.75} />}
      title="Audit logs"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void handleExport()} disabled={auditLogs.length === 0} className={outlineButton}>
            <Download size={16} stroke={1.75} />
            Export
          </button>
          <button type="button" onClick={() => setShowImportDialog(true)} className={outlineButton}>
            <Upload size={16} stroke={1.75} />
            Import
          </button>
          <button type="button" onClick={() => void loadAuditLogs()} disabled={loadingAuditLogs} className={outlineButton}>
            <RefreshCw size={16} stroke={1.75} className={cn(loadingAuditLogs && 'animate-spin motion-reduce:animate-none')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowClearDialog(true)}
            disabled={clearingAuditLogs || auditLogs.length === 0}
            className="flex h-10 items-center gap-2 rounded-full border border-[var(--color-error)]/30 px-4 text-[14px] font-semibold text-[var(--color-error)] transition-[background-color,opacity] duration-150 hover:bg-[var(--color-error)]/10 focus-visible:outline-2 focus-visible:outline-[var(--color-error)] disabled:opacity-40 motion-reduce:transition-none"
          >
            <Trash2 size={16} stroke={1.75} />
            Clear
          </button>
        </div>
      }
    >
      {error && (
        <p className="mb-3 text-[14px] font-semibold text-[var(--color-error)]">{error}</p>
      )}

      <div className="m3-inset flex flex-wrap items-center gap-3 p-3">
        <input
          placeholder="Search logs"
          aria-label="Search logs"
          value={auditLogFilters.text}
          onChange={(event) => setAuditLogFilters({ text: event.target.value })}
          className="h-11 min-w-[220px] flex-1 rounded-full bg-[var(--color-background-card)] px-4 font-mono text-[14px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        />
        <div className="w-[160px]">
          <Selector
            label="Outcome"
            isLabelHidden
            value={auditLogFilters.outcome}
            onChange={(value) =>
              setAuditLogFilters({ outcome: value as 'all' | 'succeeded' | 'failed' })
            }
            options={[
              { value: 'all', label: 'All outcomes' },
              { value: 'succeeded', label: 'Succeeded' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
        </div>
        <div className="w-[180px]">
          <Selector
            label="Operation"
            isLabelHidden
            value={auditLogFilters.operation || ALL_OPERATIONS_VALUE}
            onChange={(value) =>
              setAuditLogFilters({
                operation: value === ALL_OPERATIONS_VALUE ? '' : String(value ?? ''),
              })
            }
            options={[
              { value: ALL_OPERATIONS_VALUE, label: 'All operations' },
              ...availableOperations.map((op) => ({ value: op, label: op })),
            ]}
          />
        </div>
        <div className="w-[140px]">
          <Selector
            label="Entry limit"
            isLabelHidden
            value={String(auditLogLimit)}
            onChange={(value) => changeLimit(Number(value))}
            options={AUDIT_LOG_LIMIT_OPTIONS.map((value) => ({
              value: String(value),
              label: `${value} entries`,
            }))}
          />
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border/50 bg-[var(--color-background-card)]/60 p-1">
          {ALL_LEVELS.map((level) => {
            const isActive = auditLogFilters.levels.includes(level)
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
                  isActive
                    ? 'bg-[var(--color-surface-inset)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
              >
                <span className={cn('transition-opacity', isActive ? 'opacity-100' : 'opacity-40')}>
                  {LEVEL_ICON[level]}
                </span>
                {level}
              </button>
            )
          })}
        </div>
        <SegmentedControl
          value={auditLogFilters.sort}
          onChange={(v) => setAuditLogFilters({ sort: v as 'newest' | 'oldest' })}
          label="Sort order"
        >
          <SegmentedControlItem value="newest" label="Newest" />
          <SegmentedControlItem value="oldest" label="Oldest" />
        </SegmentedControl>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border/40">
        <div className="grid grid-cols-12 gap-2 border-b border-border/40 bg-[var(--color-surface-inset)] px-4 py-3 text-[14px] font-semibold text-[var(--color-text-secondary)]">
          <div className="col-span-2">Level</div>
          <div className="col-span-3">Operation</div>
          <div className="col-span-4">Message</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-1 text-right">Result</div>
        </div>

        <div
          ref={scrollRef}
          key={`${auditLogFilters.sort}|${auditLogFilters.outcome}|${auditLogFilters.operation}|${auditLogFilters.text}|${auditLogLimit}`}
          className="max-h-[420px] overflow-y-auto"
        >
          {loadingAuditLogs ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton height={40} width="100%" radius={4} />
              <Skeleton height={40} width="100%" radius={4} />
              <Skeleton height={40} width="100%" radius={4} />
              <Skeleton height={40} width="100%" radius={4} />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Filter size={24} stroke={1.75} className="mb-3 text-[var(--color-text-secondary)]/50" />
              <span className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                No matching logs
              </span>
              <span className="mt-1 max-w-md text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                {auditLogFilters.levels.length < ALL_LEVELS.length ||
                auditLogFilters.operation ||
                auditLogFilters.text ||
                auditLogFilters.outcome !== 'all' ||
                auditLogFilters.sort !== 'newest'
                  ? 'Adjust the filters above to expand your search'
                  : 'System activity logs will accumulate as operations execute'}
              </span>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                position: 'relative',
                width: '100%',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const entry = filteredLogs[virtualRow.index]
                if (!entry) return null
                return (
                  <div
                    key={entry.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translate3d(0, ${virtualRow.start}px, 0)`,
                    }}
                  >
                    <AuditRow
                      entry={entry}
                      isOpen={entry.id === selectedAuditLogId}
                      onToggle={() =>
                        setSelectedAuditLogId(
                          entry.id === selectedAuditLogId ? null : entry.id,
                        )
                      }
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3 text-[14px] text-[var(--color-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {filteredLogs.length} of {auditLogs.length} entries (limit {auditLogLimit})
        </span>
        <span>Backend buffer keeps 1000 entries. Export to back up history</span>
      </div>

      <AlertDialog
        isOpen={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear all audit logs?"
        description={`This will remove all audit log entries from local storage (${auditLogs.length} total). This action cannot be undone.`}
        actionLabel="Clear logs"
        onAction={handleClear}
        cancelLabel="Cancel"
        actionVariant="destructive"
      />

      <AlertDialog
        isOpen={showImportDialog}
        onOpenChange={setShowImportDialog}
        title="Import audit logs?"
        description="This will replace the current audit log with the contents of the selected JSON file. The backend keeps at most 1000 entries, anything beyond that will be dropped."
        actionLabel="Select file and import"
        onAction={() => void handleImport()}
        cancelLabel="Cancel"
        actionVariant="primary"
      />
    </SettingsSection>
  )
}