import { useState, useEffect } from 'react'
import { Upload, FileCode, CheckCircle2, XCircle, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  canResolveFilePaths,
  resolveFilePaths,
} from '@/services/fileDropService'

interface InstallApkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInstall: (filePath: string) => Promise<boolean>
  onSelectFile: () => Promise<string>
  initialFilePath?: string | undefined
}

type InstallStatus = 'idle' | 'installing' | 'success' | 'error'

export function InstallApkDialog({
  open,
  onOpenChange,
  onInstall,
  onSelectFile,
  initialFilePath,
}: InstallApkDialogProps) {
  const [filePath, setFilePath] = useState('')
  const [status, setStatus] = useState<InstallStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (open) {
      setFilePath(initialFilePath ?? '')
      setStatus('idle')
      setErrorMsg(null)
      setIsDragOver(false)
    }
  }, [open, initialFilePath])

  useEffect(() => {
    if (!open || status !== 'idle' || !initialFilePath) return
    setFilePath(initialFilePath)
  }, [open, status, initialFilePath])

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
  }

  function tryResolveDroppedFiles(files: FileList | null) {
    if (!files || files.length === 0 || !canResolveFilePaths()) return
    const apkFiles = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith('.apk'),
    )
    if (apkFiles.length === 0) return
    resolveFilePaths(apkFiles)
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install APK</DialogTitle>
          <DialogDescription>
            {isDone
              ? status === 'success'
                ? 'Installation completed successfully.'
                : 'An error occurred during installation.'
              : 'Select or drop an APK file to install on your device.'}
          </DialogDescription>
        </DialogHeader>

        <div
          style={{ ['--wails-drop-target' as string]: 'drop' }}
          onDragOver={(e) => {
            e.preventDefault()
            if (status === 'idle') setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            if (status !== 'idle') return
            tryResolveDroppedFiles(e.dataTransfer.files)
          }}
          onClick={() => {
            if (!filePath && status === 'idle') handleBrowse()
          }}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-8 py-7 transition-all duration-200',
            filePath
              ? 'opacity-40 cursor-default border-border/30'
              : isDragOver
                ? 'border-primary/70 bg-primary/5 scale-[1.01] cursor-copy'
                : 'border-border/50 hover:border-border hover:bg-muted/10 cursor-pointer',
          )}
        >
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
              isDragOver ? 'bg-primary/15' : 'bg-muted',
            )}
          >
            <Upload
              className={cn(
                'h-6 w-6 transition-transform duration-300',
                isDragOver && 'scale-110 text-primary',
              )}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {filePath ? 'APK ready' : 'Click or drop APK here'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supports local .apk files
            </p>
          </div>
        </div>

        {filePath && (
          <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/40',
                status === 'success'
                  ? 'bg-green-500/10'
                  : status === 'error'
                    ? 'bg-destructive/10'
                    : 'bg-background',
              )}
            >
              {status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : status === 'error' ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <FileCode className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-sm font-semibold break-all leading-snug">
                {fileName}
              </p>
              <p className="text-[11px] text-muted-foreground break-all font-mono opacity-60 mt-1 leading-relaxed">
                {filePath}
              </p>
            </div>
            {status === 'idle' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="shrink-0 h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {isInstalling && (
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Installing package on device...
          </div>
        )}

        {status === 'error' && errorMsg && (
          <p className="text-xs text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            {errorMsg}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          {isDone ? (
            <Button
              className="flex-1"
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
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isInstalling}
              >
                Cancel
              </Button>
              {!filePath ? (
                <Button className="flex-1" onClick={handleBrowse}>
                  Browse File
                </Button>
              ) : (
                <Button
                  className="flex-1"
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
