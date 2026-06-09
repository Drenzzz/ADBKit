import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BinarySourceBadge } from './BinarySourceBadge'
import { Check, ChevronDown, FileSearch, FolderOpen, RefreshCw, Trash2, XCircle } from 'lucide-react'
import type { BinaryInfo } from '@/lib/types'

interface BinaryModuleCardProps {
  displayName: string
  status?: BinaryInfo
  loading: boolean
  optional?: boolean
  isLast?: boolean
  onDetect: () => void
  onBrowseFile: () => void
  onBrowseFolder?: () => void
  onClear: () => void
  onSavePath: (path: string) => Promise<boolean>
}

const STATUS_LABEL: Record<string, string> = {
  ready: 'Ready',
  missing: 'Not found',
  invalid_path: 'Invalid path',
}

const STATUS_DOT: Record<string, string> = {
  ready: 'bg-emerald-500',
  missing: 'bg-red-400',
  invalid_path: 'bg-red-400',
}

export function BinaryModuleCard({
  displayName,
  status,
  loading,
  optional = false,
  isLast = false,
  onDetect,
  onBrowseFile,
  onBrowseFolder,
  onClear,
  onSavePath,
}: BinaryModuleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [customPath, setCustomPath] = useState('')
  const [verifying, setVerifying] = useState(false)

  if (loading || !status) {
    return (
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          !isLast && 'border-b border-border/30',
        )}
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
    )
  }

  const isReady = status.status === 'ready'
  const statusDot = STATUS_DOT[status.status] ?? 'bg-muted-foreground/40'
  const statusLabel = STATUS_LABEL[status.status] ?? status.status

  async function handleVerify() {
    const trimmed = customPath.trim()
    if (!trimmed) return
    setVerifying(true)
    const ok = await onSavePath(trimmed)
    setVerifying(false)
    if (ok) {
      setCustomPath('')
      setExpanded(false)
    }
  }

  async function handleBrowse() {
    setVerifying(true)
    await onBrowseFile()
    setVerifying(false)
  }

  async function handleBrowseFolder() {
    if (!onBrowseFolder) return
    setVerifying(true)
    await onBrowseFolder()
    setVerifying(false)
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        !isLast && 'border-b border-border/30',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/30"
      >
        <div className="flex items-center gap-3">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', statusDot)} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{displayName}</span>
              {optional && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                  optional
                </span>
              )}
              {isReady && <Check className="h-3 w-3 text-emerald-500" />}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
              {status.version && (
                <span className="font-mono">{status.version}</span>
              )}
              {status.path && (
                <span className="truncate max-w-[280px] font-mono">
                  {status.path}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BinarySourceBadge source={status.source} />
          <span
            className={cn(
              'text-[11px] font-medium',
              isReady ? 'text-emerald-500' : 'text-muted-foreground/70',
            )}
          >
            {statusLabel}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground/40 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/30 bg-muted/20 px-4 py-3">
          <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 pb-3 text-xs">
            <span className="text-muted-foreground/60">Path</span>
            <span className="truncate font-mono text-muted-foreground">
              {status.path || '—'}
            </span>
            {status.reason && (
              <>
                <span className="text-muted-foreground/60">Reason</span>
                <span className="flex items-center gap-1.5 text-red-400">
                  <XCircle className="h-3 w-3" />
                  {status.reason}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder={`/usr/bin/${displayName.toLowerCase()}`}
                value={customPath}
                onChange={(event) => setCustomPath(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleVerify()
                  }
                }}
                className="h-8 flex-1 font-mono text-xs"
              />
              <Button
                size="sm"
                onClick={() => void handleVerify()}
                disabled={!customPath.trim() || verifying}
                className="h-8"
              >
                Verify
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleBrowse()}
                disabled={verifying}
                className="h-8"
              >
                <FileSearch className="mr-1.5 h-3 w-3" />
                Select file
              </Button>

              {onBrowseFolder && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleBrowseFolder()}
                  disabled={verifying}
                  className="h-8"
                >
                  <FolderOpen className="mr-1.5 h-3 w-3" />
                  Select folder
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={onDetect}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Auto detect
              </Button>

              {status.path && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClear}
                  className="ml-auto h-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
