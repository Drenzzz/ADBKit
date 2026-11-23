import { useState, useEffect } from 'react'
import {
  IconUpload as Upload,
  IconFileCode as FileCode,
  IconCircleCheck as CheckCircle2,
  IconCircleXFilled as XCircle,
  IconLoader2 as Loader2,
  IconX as X,
  IconAlertTriangle as AlertTriangle,
} from "@tabler/icons-react"
import { motion } from 'motion/react'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Button } from '@astryxdesign/core/Button'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { inspectAPK } from '@/services/packageService'
import type { APKPreview } from '@/lib/types'

interface InstallApkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInstall: (filePath: string) => Promise<boolean>
  onSelectFile: () => Promise<string>
  initialFilePath?: string | undefined
}

type InstallStatus = 'idle' | 'installing' | 'success' | 'error'
type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error'

export function InstallApkDialog({
  open,
  onOpenChange,
  onInstall,
  onSelectFile,
  initialFilePath,
}: InstallApkDialogProps) {
  const reduced = useReducedMotion()
  const [filePath, setFilePath] = useState('')
  const [status, setStatus] = useState<InstallStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<APKPreview | null>(null)
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('idle')

  useEffect(() => {
    if (open) {
      setFilePath(initialFilePath ?? '')
      setStatus('idle')
      setErrorMsg(null)
      setIsDragOver(false)
      setPreview(null)
      setPreviewStatus('idle')
    }
  }, [open, initialFilePath])

  useEffect(() => {
    if (!open || status !== 'idle' || !initialFilePath) return
    setFilePath(initialFilePath)
  }, [open, status, initialFilePath])

  useEffect(() => {
    if (!open || !filePath || status !== 'idle') {
      return
    }
    let cancelled = false
    setPreviewStatus('loading')
    setPreview(null)
    inspectAPK(filePath)
      .then((result) => {
        if (cancelled) return
        setPreview(result)
        setPreviewStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setPreview(null)
        setPreviewStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [open, filePath, status])

  function formatAPKSize(bytes: number): string {
    if (bytes <= 0) return 'N/A'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  function formatSdkLevel(sdk: number): string {
    if (sdk <= 0) return 'N/A'
    return `Android ${sdk}`
  }

  async function handleInstall() {
    if (!filePath || status === 'installing') return
    setStatus('installing')
    const success = await onInstall(filePath)
    if (success) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMsg('Installation failed. Check device connection and APK compatibility.')
    }
  }

  async function handleBrowse() {
    if (status === 'installing') return
    try {
      const path = await onSelectFile()
      if (path) setFilePath(path)
    } catch {
      // user cancelled
    }
  }

  function handleReset() {
    setFilePath('')
    setStatus('idle')
    setErrorMsg(null)
    setPreview(null)
    setPreviewStatus('idle')
  }

  const fileName = filePath ? filePath.split(/[\\/]/).pop() : null
  const isInstalling = status === 'installing'
  const isDone = status === 'success' || status === 'error'

  return (
    <Dialog
      isOpen={open}
      onOpenChange={(v) => {
        if (!isInstalling) onOpenChange(v)
      }}
      width={560}
      padding={0}
      className="overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-2xl supports-backdrop-filter:bg-card/70"
    >
      <div className="dashboard-scale">
        <DialogHeader
          className="flex-row items-start justify-between space-y-0 border-b border-border/40 px-8 pb-5 pt-7"
          onOpenChange={(v) => {
            if (!isInstalling) onOpenChange(v)
          }}
          title={
            <span className="text-[22px] font-bold leading-tight tracking-tight text-[var(--color-text-primary)]">
              {isDone
                ? status === 'success' ? 'Installed' : 'Install failed'
                : 'Install APK'}
            </span>
          }
          subtitle={
            <span className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
              {isDone
                ? status === 'success'
                  ? 'Installation completed successfully.'
                  : 'An error occurred during installation.'
                : 'Select or drop an APK file to install on your connected device.'}
            </span>
          }
        />

        <div className="flex flex-col gap-5 px-8 py-6 w-full min-w-0">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              if (status === 'idle') setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragOver(false)
              if (status !== 'idle') return
              const file = e.dataTransfer?.files?.[0]
              if (file && file.name.toLowerCase().endsWith('.apk')) {
                const f = file as File & { path?: string }
                if (f.path) setFilePath(f.path)
              }
            }}
            className="relative w-full min-w-0"
          >
            <motion.div
              animate={{ scale: isDragOver ? 1.01 : 1 }}
              transition={reduced ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={() => {
                if (!filePath && status === 'idle') handleBrowse()
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-colors w-full min-w-0',
                isDragOver
                  ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]'
                  : 'border-border/50 bg-[var(--color-background-muted)]',
                filePath && 'hidden',
              )}
            >
              <motion.div
                animate={{ y: isDragOver && !reduced ? [0, 6, 0] : 0 }}
                transition={
                  isDragOver && !reduced
                    ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
                    : undefined
                }
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
                  isDragOver
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-background-card)] text-[var(--color-text-secondary)]',
                )}
              >
                <Upload className="h-7 w-7" stroke={1.75} />
              </motion.div>
              <div>
                <p className="text-[17px] font-bold tracking-tight text-[var(--color-text-primary)]">
                  Drag & drop APK here
                </p>
                <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
                  or click to browse files
                </p>
              </div>
            </motion.div>
          </div>

          {/* File selected card */}
          {filePath && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={reduced ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex items-start gap-4 rounded-2xl border border-border/40 bg-[var(--color-background-muted)] p-5 w-full min-w-0"
            >
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  status === 'success'
                    ? 'bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]'
                    : status === 'error'
                      ? 'bg-[color-mix(in_srgb,var(--color-error)_15%,transparent)] text-[var(--color-error)]'
                      : 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]',
                )}
              >
                {status === 'success' ? (
                  <CheckCircle2 className="h-6 w-6" stroke={1.75} />
                ) : status === 'error' ? (
                  <XCircle className="h-6 w-6" stroke={1.75} />
                ) : (
                  <FileCode className="h-6 w-6" stroke={1.75} />
                )}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-[17px] font-bold tracking-tight text-[var(--color-text-primary)]">
                  {previewStatus === 'ready' && preview?.appLabel ? preview.appLabel : fileName}
                </p>
                {previewStatus === 'ready' && preview?.packageName && (
                  <p className="mt-0.5 truncate text-[13px] font-mono text-[var(--color-text-secondary)]">
                    {preview.packageName}
                  </p>
                )}
                <p className="mt-1 truncate text-[14px] text-[var(--color-text-secondary)] opacity-70">
                  {filePath}
                </p>
              </div>
              {status === 'idle' && (
                <Button
                  variant="ghost"
                  isIconOnly
                  size="sm"
                  onClick={handleReset}
                  label="Remove file"
                  className="shrink-0 size-9 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  icon={<X className="h-4 w-4" />}
                />
              )}
            </motion.div>
          )}

          {/* APK metadata preview */}
          {filePath && status === 'idle' && (
            <div className="w-full min-w-0">
              {previewStatus === 'loading' && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--color-background-muted)] px-5 py-4 text-[15px] font-medium text-[var(--color-text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none text-[var(--color-accent)]" />
                  Reading APK metadata…
                </div>
              )}
              {previewStatus === 'ready' && preview && (
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border/30">
                  {[
                    { label: 'Version', value: preview.versionName ? `${preview.versionName}${preview.versionCode ? ` (${preview.versionCode})` : ''}` : 'N/A' },
                    { label: 'APK size', value: formatAPKSize(preview.sizeBytes) },
                    { label: 'Min Android', value: formatSdkLevel(preview.minSdk) },
                    { label: 'Target SDK', value: preview.targetSdk > 0 ? `API ${preview.targetSdk}` : 'N/A' },
                  ].map((m) => (
                    <div key={m.label} className="bg-[var(--color-background-card)] px-5 py-4">
                      <p className="text-[14px] font-semibold text-[var(--color-text-secondary)] opacity-80">
                        {m.label}
                      </p>
                      <p className="mt-1 truncate text-[17px] font-bold tracking-tight text-[var(--color-text-primary)]">
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {previewStatus === 'error' && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] px-5 py-4 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" />
                  Could not read APK metadata. You can still try installing this file.
                </div>
              )}
            </div>
          )}

          {isInstalling && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--color-background-muted)] px-5 py-4 text-[15px] font-medium text-[var(--color-text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none text-[var(--color-accent)]" />
              Installing package on device…
            </div>
          )}

          {status === 'error' && errorMsg && (
            <p className="rounded-2xl bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-5 py-4 text-[15px] leading-relaxed text-[var(--color-error)]">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/40 bg-[var(--color-background-muted)]/50 px-8 py-5">
          {isDone ? (
            <Button
              className="h-12 rounded-full px-7 text-[15px] font-bold"
              variant={status === 'error' ? 'secondary' : 'primary'}
              onClick={() => {
                if (status === 'success') onOpenChange(false)
                else handleReset()
              }}
              label={status === 'success' ? 'Done' : 'Try again'}
            />
          ) : (
            <>
              <Button
                variant="secondary"
                className="h-12 rounded-full px-7 text-[15px] font-bold"
                onClick={() => onOpenChange(false)}
                isDisabled={isInstalling}
                label="Cancel"
              />
              {!filePath ? (
                <Button
                  variant="primary"
                  className="h-12 rounded-full px-7 text-[15px] font-bold"
                  onClick={handleBrowse}
                  label="Browse File"
                />
              ) : (
                <Button
                  variant="primary"
                  className="h-12 gap-2 rounded-full bg-[var(--color-accent)] px-7 text-[15px] font-bold text-white hover:opacity-90 active:scale-[0.98]"
                  onClick={handleInstall}
                  isDisabled={isInstalling}
                  isLoading={isInstalling}
                  label={isInstalling ? 'Installing…' : 'Install Now'}
                />
              )}
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}
