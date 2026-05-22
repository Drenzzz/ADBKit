import { useState, useEffect } from 'react'
import { RefreshCw, Upload, Search, ArrowDownAZ, ArrowDownZA } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDevices } from '@/hooks/useDevices'
import { useAppManager } from '@/hooks/useAppManager'
import { onFileDrop } from '@/services/fileDropService'
import { PackageTable } from '@/components/apps/PackageTable'
import { BatchBar } from '@/components/apps/BatchBar'
import { InstallApkDialog } from '@/components/apps/InstallApkDialog'
import { PackageDetailSheet } from '@/components/apps/PackageDetailSheet'
import { ConfirmDialog } from '@/components/apps/ConfirmDialog'
import {
  NoDeviceState,
  NoPackagesState,
  NoSearchResultsState,
} from '@/components/apps/EmptyStates'

export default function AppsPage() {
  const { activeSerial } = useDevices()
  const appManager = useAppManager()

  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [installApkPath, setInstallApkPath] = useState<string | undefined>()
  const [detailPackage, setDetailPackage] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    description: string
    variant: 'default' | 'destructive'
    confirmLabel: string
    onConfirm: () => void
  } | null>(null)

  useEffect(() => {
    return onFileDrop((paths) => {
      const apkPath = paths.find((p) => p.toLowerCase().endsWith('.apk'))
      if (!apkPath) return
      setInstallApkPath(apkPath)
      setInstallDialogOpen(true)
    })
  }, [])

  if (!activeSerial) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">App Manager</h1>
          <p className="text-sm text-muted-foreground">
            Manage installed packages on your device.
          </p>
        </div>
        <NoDeviceState />
      </div>
    )
  }

  const isEmpty = !appManager.loading && appManager.packages.length === 0
  const hasSearch = appManager.searchTerm.trim().length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">App Manager</h1>
          <p className="text-sm text-muted-foreground">
            {appManager.allPackages.length} packages
            {appManager.lastUpdatedAt && (
              <span className="ml-2 text-xs">
                Updated {new Date(appManager.lastUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => appManager.fetchPackages(true)}
            disabled={appManager.refreshing}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${appManager.refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setInstallDialogOpen(true)}
            disabled={appManager.installing}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Install APK
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={appManager.searchTerm}
            onChange={(e) => appManager.setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        <Select
          value={appManager.filter}
          onValueChange={(v) => appManager.setFilter(v as 'user' | 'system' | 'all')}
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={appManager.statusFilter}
          onValueChange={(v) =>
            appManager.setStatusFilter(v as 'all' | 'enabled' | 'disabled')
          }
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            appManager.setSortOrder(
              appManager.sortOrder === 'az' ? 'za' : 'az',
            )
          }
          title={appManager.sortOrder === 'az' ? 'Sort Z→A' : 'Sort A→Z'}
        >
          {appManager.sortOrder === 'az' ? (
            <ArrowDownAZ className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownZA className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {appManager.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {appManager.error}
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        {isEmpty ? (
          hasSearch ? (
            <NoSearchResultsState term={appManager.searchTerm} />
          ) : (
            <NoPackagesState filter={appManager.filter} />
          )
        ) : (
          <PackageTable
            packages={appManager.packages}
            selectedPackages={appManager.selectedPackages}
            busyPackageName={appManager.busyPackageName}
            loading={appManager.loading}
            onToggleSelect={appManager.togglePackageSelection}
            onToggleAll={appManager.toggleVisibleSelection}
            onDetails={(name) => setDetailPackage(name)}
            onLaunch={appManager.launch}
            onForceStop={(name) =>
              setConfirmAction({
                title: 'Force Stop',
                description: `Force stop ${name}? This will immediately kill the app process.`,
                variant: 'default',
                confirmLabel: 'Force Stop',
                onConfirm: () => {
                  appManager.forceStop(name)
                  setConfirmAction(null)
                },
              })
            }
            onToggleEnabled={(name) => {
              const pkg = appManager.allPackages.find((p) => p.packageName === name)
              if (pkg?.isEnabled) {
                appManager.disableSingle(name)
              } else {
                appManager.enableSingle(name)
              }
            }}
            onClearData={(name) =>
              setConfirmAction({
                title: 'Clear Data',
                description: `Clear all data for ${name}? This action cannot be undone.`,
                variant: 'destructive',
                confirmLabel: 'Clear Data',
                onConfirm: () => {
                  appManager.clearData(name)
                  setConfirmAction(null)
                },
              })
            }
            onPullApk={appManager.pullApk}
            onUninstall={(name) =>
              setConfirmAction({
                title: 'Uninstall Package',
                description: `Uninstall ${name}? This will remove the app and all its data from the device.`,
                variant: 'destructive',
                confirmLabel: 'Uninstall',
                onConfirm: () => {
                  appManager.uninstallSingle(name)
                  setConfirmAction(null)
                },
              })
            }
          />
        )}
      </div>

      <BatchBar
        count={appManager.selectedPackages.length}
        busyAction={appManager.busyBatchAction}
        onUninstall={() =>
          setConfirmAction({
            title: 'Uninstall Selected Packages',
            description: `Uninstall ${appManager.selectedPackages.length} selected package(s)? This cannot be undone.`,
            variant: 'destructive',
            confirmLabel: 'Uninstall All',
            onConfirm: () => {
              appManager.uninstallBatch()
              setConfirmAction(null)
            },
          })
        }
        onEnable={appManager.enableBatch}
        onDisable={appManager.disableBatch}
        onForceStop={appManager.forceStopBatch}
        onClearData={() =>
          setConfirmAction({
            title: 'Clear Data for Selected',
            description: `Clear data for ${appManager.selectedPackages.length} selected package(s)? This cannot be undone.`,
            variant: 'destructive',
            confirmLabel: 'Clear All',
            onConfirm: () => {
              appManager.clearDataBatch()
              setConfirmAction(null)
            },
          })
        }
        onExportApk={appManager.exportApkBatch}
        onClear={appManager.clearSelection}
      />

      <InstallApkDialog
        open={installDialogOpen}
        onOpenChange={(open) => {
          setInstallDialogOpen(open)
          if (!open) setInstallApkPath(undefined)
        }}
        onInstall={async (filePath) => {
          const success = await appManager.installApkFromPath(filePath)
          if (success) setInstallDialogOpen(false)
          return success
        }}
        onSelectFile={async () => {
          const { selectApkFile } = await import('@/services/packageService')
          return selectApkFile()
        }}
        initialFilePath={installApkPath}
      />

      <PackageDetailSheet
        open={detailPackage !== null}
        onOpenChange={(open) => {
          if (!open) setDetailPackage(null)
        }}
        packageName={detailPackage ?? ''}
        onFetchDetails={appManager.getDetails}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        variant={confirmAction?.variant}
        confirmLabel={confirmAction?.confirmLabel}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </div>
  )
}
