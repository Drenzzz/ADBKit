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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
      open={open}
      onOpenChange={(v) => {
        if (!isInstalling) onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[420px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-[var(--shadow-floating)]">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold tracking-tight uppercase text-muted-foreground/80">Install APK</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {isDone
              ? status === 'success'
                ? 'Installation completed successfully.'
                : 'An error occurred during installation.'
              : 'Select or drop an APK file to install on your connected device.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 w-full min-w-0">
          {/* Dropzone Container */}
          <div
            data-file-drop-target="drop"
            onDragOver={(e) => {
              e.preventDefault()
              if (status === 'idle') setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
            }}
            className="relative w-full min-w-0"
          >
            <motion.div
              animate={{
                scale: isDragOver ? 1.015 : 1,
              }}
              onClick={() => {
                if (!filePath && status === 'idle') handleBrowse()
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-8 transition-colors text-center cursor-pointer w-full min-w-0',
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border/30 bg-muted/10',
                filePath && 'opacity-30 cursor-default pointer-events-none'
              )}
            >
              <motion.div
                animate={{
                  y: isDragOver ? (reduced ? 0 : [0, 5, 0]) : 0,
                }}
                transition={
                  isDragOver
                    ? reduced
                      ? undefined
                      : { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
                    : undefined
                }
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 bg-background text-muted-foreground shadow-sm transition-colors',
                  isDragOver && 'text-primary border-primary/30'
                )}
              >
                <Upload className="h-5 w-5" />
              </motion.div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {filePath ? 'APK File Loaded' : 'Drag & Drop APK here'}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  or click here to browse files
                </p>
              </div>
            </motion.div>
          </div>

          {/* File Selected Card */}
          {filePath && (
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : undefined}
              className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/10 p-3 w-full min-w-0"
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/40',
                  status === 'success'
                    ? 'bg-success/10 text-success border-success/20'
                    : status === 'error'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-background text-primary'
                )}
              >
                {status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : status === 'error' ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <FileCode className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-semibold break-all leading-snug text-foreground truncate w-full">
                  {previewStatus === 'ready' && preview?.appLabel ? preview.appLabel : fileName}
                </p>
                {previewStatus === 'ready' && preview && (
                  <p className="text-[10px] font-mono text-muted-foreground/70 break-all mt-0.5 truncate w-full">
                    {preview.packageName}
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground/50 break-all font-mono mt-0.5 truncate w-full leading-relaxed">
                  {filePath}
                </p>
              </div>
              {status === 'idle' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="shrink-0 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </motion.div>
          )}

          {/* APK Preview / metadata */}
          {filePath && status === 'idle' && (
            <div className="w-full min-w-0">
              {previewStatus === 'loading' && (
                <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/10 px-3.5 py-2.5 text-xs text-muted-foreground w-full">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Reading APK metadata...
                </div>
              )}
              {previewStatus === 'ready' && preview && (
                <div className="rounded-xl border border-border/40 bg-muted/10 p-3.5 w-full">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground/60">Version</span>
                      <span className="font-medium text-foreground truncate">
                        {preview.versionName || 'N/A'}
                        {preview.versionCode && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground/60 font-mono">
                            ({preview.versionCode})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground/60">APK size</span>
                      <span className="font-medium text-foreground">
                        {formatAPKSize(preview.sizeBytes)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground/60">Min Android</span>
                      <span className="font-medium text-foreground">
                        {formatSdkLevel(preview.minSdk)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground/60">Target SDK</span>
                      <span className="font-medium text-foreground">
                        {preview.targetSdk > 0 ? `API ${preview.targetSdk}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {previewStatus === 'error' && (
                <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 px-3.5 py-2.5 text-[11px] text-muted-foreground leading-relaxed w-full">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-warning" />
                  <span>
                    Could not read APK metadata. You can still try installing this file.
                  </span>
                </div>
              )}
            </div>
          )}

          {isInstalling && (
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/10 px-3.5 py-2.5 text-xs text-muted-foreground w-full">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Installing package on device...
            </div>
          )}

          {status === 'error' && errorMsg && (
            <p className="text-[11px] text-destructive rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 leading-relaxed w-full">
              {errorMsg}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2 w-full">
          {isDone ? (
            <Button
              className="flex-1 rounded-xl h-9 text-xs"
              variant={status === 'error' ? 'outline' : 'default'}
              onClick={() => {
                if (status === 'success') {
                  onOpenChange(false)
                } else {
                  handleReset()
                }
              }}
            >
              {status === 'success' ? 'Done' : 'Try again'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-9 text-xs"
                onClick={() => onOpenChange(false)}
                disabled={isInstalling}
              >
                Cancel
              </Button>
              {!filePath ? (
                <Button className="flex-1 rounded-xl h-9 text-xs" onClick={handleBrowse}>
                  Browse File
                </Button>
              ) : (
                <Button
                  className="flex-1 rounded-xl h-9 text-xs"
                  onClick={handleInstall}
                  disabled={isInstalling}
                >
                  {isInstalling ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Installing...
                    </span>
                  ) : (
                    'Install Now'
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
