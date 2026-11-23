import { useState } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { cn } from '@/lib/utils'
import { BinarySourceBadge } from './BinarySourceBadge'
import {
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconFileSearch as FileSearch,
  IconFolderOpen as FolderOpen,
  IconRefresh as RefreshCw,
  IconTrash as Trash2,
  IconCircleXFilled as XCircle
} from "@tabler/icons-react"
import type { BinaryInfo } from '@/lib/types'

interface BinaryModuleCardProps {
  displayName: string
  status?: BinaryInfo
  loading: boolean
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
  ready: 'bg-[var(--color-success)]',
  missing: 'bg-[var(--color-error)]',
  invalid_path: 'bg-[var(--color-error)]',
}

const outlineButton =
  'flex h-10 items-center gap-2 rounded-full border border-border/50 px-4 text-[14px] font-semibold text-[var(--color-text-primary)] transition-[background-color,opacity] duration-150 hover:bg-[var(--color-background-card)]/60 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none'

export function BinaryModuleCard({
  displayName,
  status,
  loading,
  isLast = false,
  onDetect,
  onBrowseFile,
  onBrowseFolder,
  onClear,
  onSavePath,
}: BinaryModuleCardProps) {
  const reduced = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const [customPath, setCustomPath] = useState('')
  const [verifying, setVerifying] = useState(false)

  if (loading || !status) {
    return (
      <div className={cn('flex items-center justify-between py-4', !isLast && 'border-b border-border/40')}>
        <div className="flex items-center gap-3">
          <Skeleton height={10} width={10} radius="rounded" />
          <Skeleton height={16} width={96} radius={2} />
        </div>
        <Skeleton height={16} width={64} radius={2} />
      </div>
    )
  }

  const isReady = status.status === 'ready'
  const statusDot = STATUS_DOT[status.status] ?? 'bg-[var(--color-text-secondary)]'
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
    <div className={cn(!isLast && 'border-b border-border/40')}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-[var(--color-background-card)]/40 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', statusDot)} />
          <div className="min-w-0">
            <span className="flex items-center gap-2 text-[16px] font-semibold text-[var(--color-text-primary)]">
              {displayName}
              {isReady && <Check size={16} stroke={2} className="text-[var(--color-success)]" />}
            </span>
            <span className="flex items-center gap-2 font-mono text-[13px] text-[var(--color-text-secondary)]">
              {status.version && <span className="truncate">{status.version}</span>}
              {status.path && <span className="truncate">{status.path}</span>}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <BinarySourceBadge source={status.source} />
          <span
            className={cn(
              'text-[14px] font-semibold',
              isReady ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]',
            )}
          >
            {statusLabel}
          </span>
          <ChevronDown
            size={18}
            stroke={1.75}
            className={cn('text-[var(--color-text-secondary)] transition-transform duration-200 motion-reduce:transition-none', expanded && 'rotate-180')}
          />
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          className="m3-inset mb-4 flex flex-col gap-3 p-4"
        >
          <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 text-[14px]">
            <span className="text-[var(--color-text-secondary)]">Path</span>
            <span className="break-all font-mono text-[13px] text-[var(--color-text-primary)]">
              {status.path || 'not set'}
            </span>
            {status.reason && (
              <>
                <span className="text-[var(--color-text-secondary)]">Reason</span>
                <span className="flex items-center gap-1.5 text-[var(--color-error)]">
                  <XCircle size={16} stroke={1.75} />
                  {status.reason}
                </span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <input
              placeholder={`/usr/bin/${displayName.toLowerCase()}`}
              aria-label={`Custom path for ${displayName}`}
              value={customPath}
              onChange={(event) => setCustomPath(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleVerify()
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-full bg-[var(--color-background-card)] px-4 font-mono text-[14px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            />
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={!customPath.trim() || verifying}
              className="flex h-11 shrink-0 items-center rounded-full bg-[var(--color-accent)] px-5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
            >
              Verify
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void handleBrowse()} disabled={verifying} className={outlineButton}>
              <FileSearch size={16} stroke={1.75} />
              Select file
            </button>
            {onBrowseFolder && (
              <button type="button" onClick={() => void handleBrowseFolder()} disabled={verifying} className={outlineButton}>
                <FolderOpen size={16} stroke={1.75} />
                Select folder
              </button>
            )}
            <button type="button" onClick={onDetect} disabled={loading} className={outlineButton}>
              <RefreshCw size={16} stroke={1.75} />
              Auto detect
            </button>
            {status.path && (
              <button
                type="button"
                onClick={onClear}
                className="ml-auto flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                <Trash2 size={16} stroke={1.75} />
                Clear
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}