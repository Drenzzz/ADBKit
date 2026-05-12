import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, FileSearch, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getBinaryStatus,
  retryBinaryDetection,
  selectBinaryFile,
  setCustomBinary,
  clearCustomBinary,
} from '@/services/binaryService'
import type { BinaryInfo, BinaryName } from '@/lib/types'

function BinaryRow({
  label,
  info,
  loading,
  onSelect,
  onClear,
}: {
  label: string
  info?: BinaryInfo
  loading: boolean
  onSelect: () => void
  onClear: () => void
}) {
  const status = info?.status ?? 'missing'
  const ready = status === 'ready'
  const hasPath = !!info?.path

  const variant = ready ? 'default' : status === 'invalid_path' ? 'destructive' : 'secondary'

  return (
    <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2.5">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {ready && <Check className="h-3 w-3 text-green-500" />}
          <span className="text-sm font-medium">{label}</span>
          <Badge variant={variant} className="text-[10px]">
            {ready ? info?.version ?? 'ready' : status}
          </Badge>
        </div>
        {hasPath && (
          <span className="text-xs text-muted-foreground truncate max-w-[300px]" title={info.path}>
            {info.path}
            {info.source ? ` (${info.source})` : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={onSelect} disabled={loading}>
          <FileSearch className="h-3.5 w-3.5" />
        </Button>
        {hasPath && (
          <Button variant="ghost" size="sm" onClick={onClear} disabled={loading}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function BinaryManagerPanel() {
  const [status, setStatus] = useState<BinaryInfo[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const detect = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getBinaryStatus()
      setStatus([result.adb, result.fastboot, result.scrcpy])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Detection failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    detect()
  }, [detect])

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      await retryBinaryDetection()
      const result = await getBinaryStatus()
      setStatus([result.adb, result.fastboot, result.scrcpy])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (name: BinaryName) => {
    try {
      const path = await selectBinaryFile(name)
      if (path) {
        await setCustomBinary(name, path)
        await detect()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Selection failed')
    }
  }

  const handleClear = async (name: BinaryName) => {
    try {
      await clearCustomBinary(name)
      await detect()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clear failed')
    }
  }

  const binaryNames: { name: BinaryName; label: string }[] = [
    { name: 'adb', label: 'ADB' },
    { name: 'fastboot', label: 'Fastboot' },
    { name: 'scrcpy', label: 'Scrcpy' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Binary Manager</h2>
        <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry detection
        </Button>
      </div>

      {loading && !status ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {binaryNames.map(({ name, label }) => (
            <BinaryRow
              key={name}
              label={label}
              info={status?.find((s) => s.name === name)}
              loading={loading}
              onSelect={() => handleSelect(name)}
              onClear={() => handleClear(name)}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
