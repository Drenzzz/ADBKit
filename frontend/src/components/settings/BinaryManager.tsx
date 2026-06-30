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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Binary } from 'lucide-react'
import { toast } from 'sonner'
import type { BinaryInfo } from '@/lib/types'

const BINARY_NAMES: { key: 'adb' | 'fastboot' | 'scrcpy'; displayName: string }[] = [
  { key: 'adb', displayName: 'ADB' },
  { key: 'fastboot', displayName: 'Fastboot' },
  { key: 'scrcpy', displayName: 'scrcpy' },
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
    <Card className="border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/40 rounded-2xl shadow-[var(--shadow-card)] h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Binary className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
          Binaries
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow p-0">
        {loading && !status ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]/40 dark:divide-[var(--border)]/40">
            {BINARY_NAMES.map(({ key, displayName }, index) => (
              <BinaryModuleCard
                key={key}
                displayName={displayName}
                status={status?.[key] as BinaryInfo | undefined}
                loading={loading}
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
      </CardContent>
    </Card>
  )
}
