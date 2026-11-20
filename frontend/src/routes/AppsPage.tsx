import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  IconLoader2,
  IconRefresh,
  IconUpload,
  IconSearch,
} from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import { Selector } from '@astryxdesign/core/Selector'
import { useDevices } from '@/hooks/useDevices'
import { DeviceManagerSheet } from '@/components/devices/DeviceManagerSheet'
import { useAppManager } from '@/hooks/useAppManager'
import { onFileDrop } from '@/services/fileDropService'
import { selectApkFile } from '@/services/packageService'
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
import type {
  PackageFilter,
  PackageSortOrder,
  PackageStatusFilter,
} from '@/lib/types'

const SOURCE_TABS: { value: PackageFilter; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'system', label: 'System' },
  { value: 'all', label: 'All' },
]

const STATUS_TABS: { value: PackageStatusFilter; label: string }[] = [
  { value: 'all', label: 'Any' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
]

const SORT_OPTIONS: { value: PackageSortOrder; label: string }[] = [
  { value: 'az', label: 'A to Z' },
  { value: 'za', label: 'Z to A' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
]

export default function AppsPage() {
  const reduced = useReducedMotion()
  const appManager = useAppManager()

  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [installApkPath, setInstallApkPath] = useState<string | undefined>()
  const [managerOpen, setManagerOpen] = useState(false)
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

  const { activeSerial, refreshing, refreshDevices } = useDevices()

  if (!activeSerial) {
    return (
      <div className="dashboard-scale flex h-full min-h-0 flex-col gap-4 p-5">
        <Heading level={1} type="display-1" weight="semibold">Apps</Heading>
        <div className="min-h-0 flex-1">
          <NoDeviceState onRefresh={refreshDevices} refreshing={refreshing} />
        </div>
        <DeviceManagerSheet open={managerOpen} onClose={() => setManagerOpen(false)} />
      </div>
    )
  }

  const totalPackages = appManager.allPackages.length
  const enabledPackages = appManager.allPackages.filter((p) => p.isEnabled).length
  const disabledPackages = appManager.allPackages.filter((p) => !p.isEnabled).length
  const isEmpty = !appManager.loading && appManager.packages.length === 0
  const hasSearch = appManager.searchTerm.trim().length > 0

  const confirm = (
    title: string,
    description: string,
    confirmLabel: string,
    variant: 'default' | 'destructive',
    onConfirm: () => void,
  ) => setConfirmAction({ title, description, confirmLabel, variant, onConfirm })

  const tableHandlers = {
    selectedPackages: appManager.selectedPackages,
    busyPackageName: appManager.busyPackageName,
    loading: appManager.loading,
    detailsCache: appManager.detailsCache,
    onToggleSelect: appManager.togglePackageSelection,
    onToggleAll: appManager.toggleVisibleSelection,
    onDetails: (name: string) => setDetailPackage(name),
    onLaunch: appManager.launch,
    onForceStop: (name: string) =>
      confirm('Force stop app', `Force stop ${name}? All active processes will be terminated.`, 'Force stop', 'default', () => {
        appManager.forceStop(name)
        setConfirmAction(null)
      }),
    onToggleEnabled: (name: string) => {
      const pkg = appManager.allPackages.find((p) => p.packageName === name)
      if (pkg?.isEnabled) appManager.disableSingle(name)
      else appManager.enableSingle(name)
    },
    onClearData: (name: string) =>
      confirm('Clear app data', `Clear all data and cache for ${name}? This cannot be undone.`, 'Clear data', 'destructive', () => {
        appManager.clearData(name)
        setConfirmAction(null)
      }),
    onPullApk: appManager.pullApk,
    onUninstall: (name: string) =>
      confirm('Uninstall app', `Uninstall ${name} and all its settings? This cannot be undone.`, 'Uninstall', 'destructive', () => {
        appManager.uninstallSingle(name)
        setConfirmAction(null)
      }),
    loadDetails: appManager.loadDetails,
  }

  return (
    <motion.div
      className="dashboard-scale js flex h-full min-h-0 flex-col gap-4 p-5"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.18 : 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="m3-surface flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <Heading level={1} type="display-1" weight="semibold" maxLines={1}>Apps</Heading>
          <Text type="body" color="secondary">
            {totalPackages > 0
              ? `${totalPackages} packages · ${enabledPackages} on · ${disabledPackages} off`
              : 'Manage installed applications and system packages'}
          </Text>
        </div>
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
        <HStack gap={2}>
          <Button
            label={appManager.installing ? 'Installing…' : 'Install APK'}
            icon={appManager.installing
              ? <IconLoader2 size={18} className="animate-spin motion-reduce:animate-none" />
              : <IconUpload size={18} stroke={1.75} />}
            variant="secondary"
            isDisabled={appManager.installing}
            onClick={() => setInstallDialogOpen(true)}
          />
          <Button
            label="Refresh"
            icon={<IconRefresh size={18} stroke={1.75} />}
            variant="ghost"
            isIconOnly
            tooltip="Refresh packages"
            isLoading={appManager.refreshing}
            isDisabled={appManager.refreshing || appManager.installing}
            onClick={() => appManager.fetchPackages(true)}
          />
        </HStack>
        </motion.div>
      </div>

      {appManager.error && (
        <div className="m3-surface px-4 py-3 text-[14px] text-[var(--color-error)]">
          {appManager.error}
        </div>
      )}

      <div className="m3-surface flex flex-wrap items-center gap-2 rounded-3xl px-4 py-2.5">
        <div className="relative min-w-[280px] flex-1">
          <IconSearch
            size={18}
            stroke={1.75}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
          />
          <input
            type="search"
            placeholder="Search packages…"
            value={appManager.searchTerm}
            onChange={(e) => appManager.setSearchTerm(e.target.value)}
            aria-label="Search packages"
            className="h-11 w-full rounded-full bg-[color-mix(in_srgb,var(--color-background-muted)_88%,black)] pl-10 pr-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:bg-[color-mix(in_srgb,var(--color-background-muted)_70%,black)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          />
        </div>

        <Selector
          label="Source"
          isLabelHidden
          value={appManager.filter}
          onChange={(v) => appManager.setFilter(v as PackageFilter)}
          options={SOURCE_TABS.map((t) => ({ value: t.value, label: t.label }))}
        />
        <Selector
          label="Status"
          isLabelHidden
          value={appManager.statusFilter}
          onChange={(v) => appManager.setStatusFilter(v as PackageStatusFilter)}
          options={STATUS_TABS.map((t) => ({ value: t.value, label: t.label }))}
        />

        <Selector
          label="Sort order"
          isLabelHidden
          value={appManager.sortOrder}
          onChange={(v) => appManager.setSortOrder(v as PackageSortOrder)}
          options={SORT_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isEmpty ? (
          hasSearch ? <NoSearchResultsState term={appManager.searchTerm} /> : <NoPackagesState filter={appManager.filter} />
        ) : (
          <PackageTable packages={appManager.packages} {...tableHandlers} />
        )}
      </div>

      <BatchBar
        count={appManager.selectedPackages.length}
        busyAction={appManager.busyBatchAction}
        onUninstall={() =>
          confirm('Uninstall selected', `Permanently uninstall ${appManager.selectedPackages.length} selected package(s)?`, 'Uninstall all', 'destructive', () => {
            appManager.uninstallBatch()
            setConfirmAction(null)
          })
        }
        onEnable={appManager.enableBatch}
        onDisable={appManager.disableBatch}
        onForceStop={appManager.forceStopBatch}
        onClearData={() =>
          confirm('Clear data for selected apps', `Clear cache and data for ${appManager.selectedPackages.length} selected package(s)?`, 'Clear all', 'destructive', () => {
            appManager.clearDataBatch()
            setConfirmAction(null)
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
        onSelectFile={async () => selectApkFile()}
        initialFilePath={installApkPath}
      />

      <PackageDetailSheet
        open={detailPackage !== null}
        onOpenChange={(open) => { if (!open) setDetailPackage(null) }}
        packageName={detailPackage ?? ''}
        onFetchDetails={appManager.getDetails}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => { if (!open) setConfirmAction(null) }}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        variant={confirmAction?.variant}
        confirmLabel={confirmAction?.confirmLabel}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </motion.div>
  )
}
