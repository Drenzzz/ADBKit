import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { RefreshCw, Package, Upload, Loader2, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { cn } from '@/lib/utils'
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
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
]

interface SegmentedTabsProps<T extends string> {
  tabs: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: SegmentedTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const activeIdx = tabs.findIndex((t) => t.value === value)
    const activeEl = itemRefs.current[activeIdx]
    const containerEl = containerRef.current
    if (!activeEl || !containerEl) return
    const ar = activeEl.getBoundingClientRect()
    const cr = containerEl.getBoundingClientRect()
    setIndicator({ left: ar.left - cr.left, width: ar.width })
  }, [value, tabs])

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center gap-0.5 rounded-full border border-border/50 bg-muted/20 p-0.5"
    >
      <div
        className="absolute top-0.5 bottom-0.5 rounded-full bg-background shadow-sm transition-all duration-200 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {tabs.map((tab, idx) => (
        <Button
          key={tab.value}
          ref={(el) => {
            itemRefs.current[idx] = el as HTMLButtonElement
          }}
          variant="ghost"
          size="sm"
          onClick={() => onChange(tab.value)}
          className={cn(
            'relative z-10 rounded-full px-3 py-1 h-auto text-xs font-medium transition-colors duration-150 hover:bg-transparent',
            value === tab.value
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}

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
          <h1 className="text-lg font-semibold tracking-tight">Apps</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage installed applications and system packages
          </p>
        </div>
        <NoDeviceState />
      </div>
    )
  }

  const totalPackages = appManager.allPackages.length
  const enabledPackages = appManager.allPackages.filter((p) => p.isEnabled).length
  const disabledPackages = appManager.allPackages.filter((p) => !p.isEnabled).length

  const isEmpty = !appManager.loading && appManager.packages.length === 0
  const hasSearch = appManager.searchTerm.trim().length > 0

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 pb-24 font-sans"
    >
      {/* Header Panel */}
      <motion.header
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Apps
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage installed applications and system packages
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalPackages > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground mr-2">
              <span className="tabular font-medium">{totalPackages}</span>
              <span>packages</span>
              <span className="text-border">·</span>
              <span className="tabular font-medium text-success">
                {enabledPackages}
              </span>
              <span>on</span>
              <span className="text-border">·</span>
              <span className="tabular font-medium text-warning">
                {disabledPackages}
              </span>
              <span>off</span>
            </div>
          )}

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setInstallDialogOpen(true)}
              disabled={appManager.installing}
            >
              {appManager.installing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {appManager.installing ? 'Installing…' : 'Install APK'}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => appManager.fetchPackages(true)}
              disabled={appManager.refreshing || appManager.installing}
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', appManager.refreshing && 'animate-spin')}
              />
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {appManager.error && (
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {appManager.error}
        </motion.div>
      )}

      {/* Control Panel */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Package className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search packages…"
            value={appManager.searchTerm}
            onChange={(e) => appManager.setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-xs transition-colors hover:border-border/80 focus:border-primary"
          />
        </div>

        <SegmentedTabs
          tabs={SOURCE_TABS}
          value={appManager.filter}
          onChange={appManager.setFilter}
        />
        <SegmentedTabs
          tabs={STATUS_TABS}
          value={appManager.statusFilter}
          onChange={appManager.setStatusFilter}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/50 bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            {SORT_OPTIONS.find((o) => o.value === appManager.sortOrder)?.label ?? 'Sort'}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-border/60">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => appManager.setSortOrder(opt.value)}
                className={cn(
                  appManager.sortOrder === opt.value && 'font-medium text-primary',
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Virtualized List Card */}
      <motion.div variants={itemVariants}>
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
            detailsCache={appManager.detailsCache}
            onToggleSelect={appManager.togglePackageSelection}
            onToggleAll={appManager.toggleVisibleSelection}
            onDetails={(name) => setDetailPackage(name)}
            onLaunch={appManager.launch}
            onForceStop={(name) =>
              setConfirmAction({
                title: 'Force Stop App',
                description: `Are you sure you want to force stop ${name}? This will terminate all active processes for this package immediately.`,
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
                title: 'Clear Application Data',
                description: `Are you sure you want to clear all data and cache for ${name}? This action is destructive and cannot be undone.`,
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
                title: 'Uninstall Application',
                description: `Are you sure you want to uninstall ${name}? This will permanently remove the application and its associated settings.`,
                variant: 'destructive',
                confirmLabel: 'Uninstall',
                onConfirm: () => {
                  appManager.uninstallSingle(name)
                  setConfirmAction(null)
                },
              })
            }
            loadDetails={appManager.loadDetails}
          />
        )}
      </motion.div>

      <BatchBar
        count={appManager.selectedPackages.length}
        busyAction={appManager.busyBatchAction}
        onUninstall={() =>
          setConfirmAction({
            title: 'Uninstall Selected Packages',
            description: `Are you sure you want to permanently uninstall the ${appManager.selectedPackages.length} selected package(s)? This action cannot be undone.`,
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
            title: 'Clear Data for Selected Apps',
            description: `Are you sure you want to clear cache and data for the ${appManager.selectedPackages.length} selected package(s)?`,
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
    </motion.div>
  )
}
