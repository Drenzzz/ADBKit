import { useSettings } from '@/hooks/useSettings'
import { BinaryModuleCard } from './BinaryModuleCard'
import {
  clearCustomBinary,
  getBinaryStatus,
  selectBinaryFile,
  selectPlatformToolsDirectory,
  setCustomBinary,
} from '@/services/binaryService'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { BinaryInfo } from '@/lib/types'

const BINARY_NAMES: { key: 'adb' | 'fastboot' | 'scrcpy'; displayName: string; optional: boolean }[] = [
  { key: 'adb', displayName: 'ADB', optional: false },
  { key: 'fastboot', displayName: 'Fastboot', optional: false },
  { key: 'scrcpy', displayName: 'scrcpy', optional: true },
]

export function BinaryManager() {
  const queryClient = useQueryClient()
  const { loadConfig } = useSettings()

  const binaryQuery = useQuery({
    queryKey: ['settings', 'binary-status'],
    queryFn: getBinaryStatus,
  })

  const status = binaryQuery.data
  const loading = binaryQuery.isLoading || binaryQuery.isFetching

  function reload() {
    queryClient.invalidateQueries({ queryKey: ['settings', 'binary-status'] })
    void loadConfig()
  }

  async function handleSavePath(name: 'adb' | 'fastboot' | 'scrcpy', path: string) {
    try {
      await setCustomBinary(name, path)
      toast.success(`${name} path updated`, { description: path })
      reload()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save path')
      return false
    }
  }

  async function handleBrowseFile(name: 'adb' | 'fastboot' | 'scrcpy') {
    try {
      const path = await selectBinaryFile(name)
      if (!path) return
      await setCustomBinary(name, path)
      toast.success(`${name} path updated`, { description: path })
      reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Selection failed')
    }
  }

  async function handleBrowseFolder() {
    try {
      const selection = await selectPlatformToolsDirectory()
      if (!selection.directory) return
      await setCustomBinary('adb', selection.adbPath)
      await setCustomBinary('fastboot', selection.fastbootPath)
      toast.success('Platform tools directory applied')
      reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Folder selection failed')
    }
  }

  async function handleClear(name: 'adb' | 'fastboot' | 'scrcpy') {
    try {
      await clearCustomBinary(name)
      toast.success(`${name} path cleared`)
      reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Clear failed')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {loading && !status ? (
        <div className="rounded-lg border border-border/40">
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/40">
          {BINARY_NAMES.map(({ key, displayName, optional }, index) => (
            <BinaryModuleCard
              key={key}
              displayName={displayName}
              status={status?.[key] as BinaryInfo | undefined}
              loading={loading}
              optional={optional}
              isLast={index === BINARY_NAMES.length - 1}
              onDetect={reload}
              onBrowseFile={() => void handleBrowseFile(key)}
              onBrowseFolder={key === 'adb' || key === 'fastboot' ? () => void handleBrowseFolder() : undefined}
              onClear={() => void handleClear(key)}
              onSavePath={(path) => handleSavePath(key, path)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
