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
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0b10]/40 rounded-2xl shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Binary className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
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
          <div className="divide-y divide-zinc-150/40 dark:divide-zinc-800/40">
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
      </CardContent>
    </Card>
  )
}
