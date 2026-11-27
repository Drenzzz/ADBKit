import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  IconFileCode,
  IconLoader2,
  IconRefresh,
  IconUpload,
  IconSearch,
} from '@tabler/icons-react'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Selector } from '@astryxdesign/core/Selector'
import { useDevices } from '@/hooks/useDevices'
import { DeviceManagerSheet } from '@/components/devices/DeviceManagerSheet'
import { useAppManager } from '@/hooks/useAppManager'
import { useDebloater } from '@/hooks/useDebloater'
import { onFileDrop } from '@/services/fileDropService'
import { selectApkFile } from '@/services/packageService'
import { PackageTable } from '@/components/apps/PackageTable'
import { BatchBar } from '@/components/apps/BatchBar'
import { InstallApkDialog } from '@/components/apps/InstallApkDialog'
import { PackageDetailSheet } from '@/components/apps/PackageDetailSheet'
import { ConfirmDialog } from '@/components/apps/ConfirmDialog'
import { DebloaterView } from '@/components/apps/DebloaterView'
import { DebloaterConfirmDialog } from '@/components/apps/DebloaterConfirmDialog'
import { DebloaterCatalogDialog } from '@/components/apps/DebloaterCatalogDialog'
import { RestoreView } from '@/components/apps/RestoreView'
import {
  NoDeviceState,
  NoPackagesState,
  NoSearchResultsState,
} from '@/components/apps/EmptyStates'
import type {
  AppsViewMode,
  DebloatRiskFilter,
  DebloatTypeFilter,
  DebloatVendorFilter,
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

const VENDOR_OPTIONS: { value: DebloatVendorFilter; label: string }[] = [
  { value: 'all', label: 'All vendors' },
  { value: 'xiaomi', label: 'Xiaomi' },
  { value: 'google', label: 'Google' },
  { value: 'third-party', label: 'Partner' },
  { value: 'custom', label: 'Custom' },
]

const RISK_OPTIONS: { value: DebloatRiskFilter; label: string }[] = [
  { value: 'all', label: 'All risks' },
  { value: 'safe', label: 'Safe' },
  { value: 'caution', label: 'Caution' },
]

const TYPE_OPTIONS: { value: DebloatTypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'system', label: 'System' },
  { value: 'user', label: 'User' },
]

const RESTORE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All uninstalled' },
  { value: 'catalog', label: 'Catalog only' },
]

export default function AppsPage() {
  const reduced = useReducedMotion()
  const appManager = useAppManager()
  const debloater = useDebloater()

  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [installApkPath, setInstallApkPath] = useState<string | undefined>()
  const [managerOpen, setManagerOpen] = useState(false)
  const [detailPackage, setDetailPackage] = useState<string | null>(null)
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false)
  const [debloatConfirmAction, setDebloatConfirmAction] = useState<'debloat' | 'disable' | null>(null)
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
  const mode = debloater.activeMode
  const activeError = mode === 'packages' ? appManager.error : debloater.error

  const headerSubtitle = (() => {
    if (mode === 'debloater') {
      const counts = debloater.scanResult?.counts
      const deviceLabel = [debloater.scanResult?.deviceBrand, debloater.scanResult?.deviceModel]
        .filter(Boolean)
        .join(' ')
      if (counts) {
        return `${counts.total} candidates · ${counts.safe} safe · ${counts.caution} caution${deviceLabel ? ` · ${deviceLabel}` : ''}`
      }
      return 'Safely remove preinstalled bloatware for user 0'
    }
    if (mode === 'restore') {
      return debloater.restorableCount > 0
        ? `${debloater.restorableCount} uninstalled system package(s) available to restore`
        : 'Recover system packages previously uninstalled for user 0'
    }
    return totalPackages > 0
      ? `${totalPackages} packages · ${enabledPackages} on · ${disabledPackages} off`
      : 'Manage installed applications and system packages'
  })()

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
          <Text type="body" color="secondary">{headerSubtitle}</Text>
        </div>
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
        <HStack gap={2}>
          {mode === 'packages' && (
            <>
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
            </>
          )}
          {mode === 'debloater' && (
            <>
              <Button
                label="Catalog"
                icon={<IconFileCode size={18} stroke={1.75} />}
                variant="secondary"
                onClick={() => setCatalogDialogOpen(true)}
              />
              <Button
                label="Rescan"
                icon={<IconRefresh size={18} stroke={1.75} />}
                variant="ghost"
                isIconOnly
                tooltip="Rescan installed bloatware"
                isLoading={debloater.scanning}
                isDisabled={debloater.scanning}
                onClick={() => debloater.scan()}
              />
            </>
          )}
          {mode === 'restore' && (
            <Button
              label="Refresh"
              icon={<IconRefresh size={18} stroke={1.75} />}
              variant="ghost"
              isIconOnly
              tooltip="Refresh uninstalled packages"
              isLoading={debloater.loadingRestorable}
              isDisabled={debloater.loadingRestorable}
              onClick={() => debloater.fetchRestorable()}
            />
          )}
        </HStack>
        </motion.div>
      </div>

      {activeError && (
        <div className="m3-surface px-4 py-3 text-[14px] text-[var(--color-error)]">
          {activeError}
        </div>
      )}

      <div className="m3-surface flex flex-wrap items-center gap-2 rounded-3xl px-4 py-2.5">
        <SegmentedControl
          label="Apps view"
          size="sm"
          value={mode}
          onChange={(v) => debloater.setActiveMode(v as AppsViewMode)}
        >
          <SegmentedControlItem value="packages" label="Packages" />
          <SegmentedControlItem value="debloater" label="Debloater" />
          <SegmentedControlItem value="restore" label="Restore" />
        </SegmentedControl>

        <div className="relative min-w-[240px] flex-1">
          <IconSearch
            size={18}
            stroke={1.75}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
          />
          <input
            type="search"
            placeholder={
              mode === 'debloater'
                ? 'Search candidates…'
                : mode === 'restore'
                  ? 'Search uninstalled packages…'
                  : 'Search packages…'
            }
            value={
              mode === 'debloater'
                ? debloater.searchTerm
                : mode === 'restore'
                  ? debloater.restoreSearchTerm
                  : appManager.searchTerm
            }
            onChange={(e) => {
              if (mode === 'debloater') debloater.setSearchTerm(e.target.value)
              else if (mode === 'restore') debloater.setRestoreSearchTerm(e.target.value)
              else appManager.setSearchTerm(e.target.value)
            }}
            aria-label={
              mode === 'debloater'
                ? 'Search candidates'
                : mode === 'restore'
                  ? 'Search uninstalled packages'
                  : 'Search packages'
            }
            className="h-11 w-full rounded-full bg-[color-mix(in_srgb,var(--color-background-muted)_88%,black)] pl-10 pr-4 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus-visible:bg-[color-mix(in_srgb,var(--color-background-muted)_70%,black)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          />
        </div>

        {mode === 'packages' && (
          <>
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
          </>
        )}

        {mode === 'debloater' && (
          <>
            <Selector
              label="Vendor"
              isLabelHidden
              value={debloater.vendorFilter}
              onChange={(v) => debloater.setVendorFilter(v as DebloatVendorFilter)}
              options={VENDOR_OPTIONS}
            />
            <Selector
              label="Risk"
              isLabelHidden
              value={debloater.riskFilter}
              onChange={(v) => debloater.setRiskFilter(v as DebloatRiskFilter)}
              options={RISK_OPTIONS}
            />
            <Selector
              label="Type"
              isLabelHidden
              value={debloater.typeFilter}
              onChange={(v) => debloater.setTypeFilter(v as DebloatTypeFilter)}
              options={TYPE_OPTIONS}
            />
          </>
        )}

        {mode === 'restore' && (
          <Selector
            label="Restore filter"
            isLabelHidden
            value={debloater.restoreCatalogOnly ? 'catalog' : 'all'}
            onChange={(v) => debloater.setRestoreCatalogOnly(v === 'catalog')}
            options={RESTORE_FILTER_OPTIONS}
          />
        )}
      </div>

      {mode === 'packages' && (
        <>
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
        </>
      )}

      {mode === 'debloater' && (
        <DebloaterView
          items={debloater.filteredCandidates}
          presets={debloater.scanResult?.presets ?? []}
          selectedPackages={debloater.selectedDebloat}
          loading={debloater.scanning}
          busyAction={debloater.executingAction}
          searchTerm={debloater.searchTerm}
          onToggleSelect={debloater.toggleDebloatSelect}
          onToggleAll={debloater.toggleAllDebloat}
          onApplyPreset={debloater.applyPreset}
          onDebloat={() => setDebloatConfirmAction('debloat')}
          onDisable={() => setDebloatConfirmAction('disable')}
          onClearSelection={debloater.clearDebloatSelection}
        />
      )}

      {mode === 'restore' && (
        <RestoreView
          items={debloater.filteredRestorable}
          selectedPackages={debloater.selectedRestore}
          loading={debloater.loadingRestorable}
          busyPackage={debloater.busyRestorePackage}
          busyBatch={debloater.executingAction === 'restore'}
          searchTerm={debloater.restoreSearchTerm}
          onToggleSelect={debloater.toggleRestoreSelect}
          onToggleAll={debloater.toggleAllRestore}
          onRestoreSingle={(pkg) => debloater.executeRestore([pkg])}
          onRestoreBatch={() => debloater.executeRestore(debloater.selectedRestore)}
          onClearSelection={debloater.clearRestoreSelection}
        />
      )}

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

      <DebloaterConfirmDialog
        open={debloatConfirmAction !== null}
        onOpenChange={(open) => { if (!open) setDebloatConfirmAction(null) }}
        action={debloatConfirmAction ?? 'debloat'}
        items={debloater.selectedCandidateItems}
        busy={debloater.executingAction !== null}
        onConfirm={() => {
          if (debloatConfirmAction === 'disable') {
            return debloater.executeDisable()
          }
          return debloater.executeDebloat()
        }}
      />

      <DebloaterCatalogDialog
        open={catalogDialogOpen}
        onOpenChange={setCatalogDialogOpen}
        meta={debloater.catalogMeta}
        onImport={debloater.importCatalog}
        onExportTemplate={debloater.exportTemplate}
        onClearCustom={debloater.clearCatalog}
      />
    </motion.div>
  )
}
