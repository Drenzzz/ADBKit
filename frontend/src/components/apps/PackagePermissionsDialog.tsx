import { useEffect, useState, useMemo, useCallback } from 'react'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Switch } from '@astryxdesign/core/Switch'
import { Button } from '@astryxdesign/core/Button'
import {
  IconSearch,
  IconRefresh,
  IconShieldLock,
  IconAlertTriangle,
  IconInfoCircle,
  IconLoader2,
} from '@tabler/icons-react'
import type {
  PackagePermission,
  PackagePermissionsReport,
  PackageAppOp,
} from '@/lib/types'
import {
  getPackagePermissions,
  setPackagePermission,
  setPackageAppOp,
} from '@/services/packageService'
import { toast } from '@/lib/toast'

interface PackagePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageName: string
}

type BusyKey = string | null // e.g. "perm:android.permission.CAMERA" or "appop:SYSTEM_ALERT_WINDOW"
type Tab = 'runtime' | 'appops' | 'install'

const MODE_OPTIONS = ['allow', 'deny', 'ignore', 'default'] as const

function groupPermissions(perms: PackagePermission[]) {
  const groups = new Map<string, PackagePermission[]>()
  for (const p of perms) {
    const g = p.group || 'Other'
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(p)
  }
  // sort groups by our preferred order, then alpha
  const order = ['Camera', 'Microphone', 'Location', 'Phone', 'SMS', 'Contacts', 'Calendar', 'Media', 'Storage', 'Nearby', 'Notifications', 'Sensors', 'Other']
  const entries = Array.from(groups.entries())
  entries.sort((a, b) => {
    const ia = order.indexOf(a[0])
    const ib = order.indexOf(b[0])
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a[0].localeCompare(b[0])
  })
  return entries
}

function PermissionRow({
  perm,
  busy,
  onToggle,
}: {
  perm: PackagePermission
  busy: boolean
  onToggle: (perm: PackagePermission, granted: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-[var(--color-background-muted)]/60">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
            {perm.label}
          </span>
          {perm.isGranted && perm.isRuntime && (
            <span className="inline-flex h-5 items-center rounded-full bg-[var(--color-success)]/15 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-success)]">granted</span>
          )}
          {!perm.isGranted && perm.isRuntime && (
            <span className="inline-flex h-5 items-center rounded-full bg-[var(--color-text-secondary)]/15 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">denied</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">{perm.name}</p>
      </div>
      {perm.isRuntime ? (
        <div className="shrink-0 pt-1">
          {busy ? (
            <span className="inline-flex size-6 items-center justify-center">
              <IconLoader2 size={16} className="animate-spin text-[var(--color-text-secondary)] motion-reduce:animate-none" />
            </span>
          ) : (
            <Switch
              label={`${perm.label} permission`}
              isLabelHidden
              value={perm.isGranted}
              onChange={(v) => onToggle(perm, v as boolean)}
            />
          )}
        </div>
      ) : (
        <span className="shrink-0 pt-1 text-[12px] text-[var(--color-text-secondary)]">read only</span>
      )}
    </div>
  )
}

function AppOpRow({
  op,
  busy,
  onSetMode,
}: {
  op: PackageAppOp
  busy: boolean
  onSetMode: (op: PackageAppOp, mode: string) => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl px-4 py-3 transition-colors hover:bg-[var(--color-background-muted)]/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-[var(--color-text-primary)]">{op.label}</span>
          <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold uppercase tracking-wide ${op.mode === 'allow' ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' : op.mode === 'deny' || op.mode === 'ignore' ? 'bg-[var(--color-error)]/12 text-[var(--color-error)]' : 'bg-[var(--color-text-secondary)]/12 text-[var(--color-text-secondary)]'}`}>
            {op.mode}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">{op.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pt-1 sm:pt-0">
        {busy ? (
          <span className="inline-flex h-8 w-[180px] items-center justify-center rounded-full bg-[var(--color-background-muted)]/60">
            <IconLoader2 size={16} className="animate-spin text-[var(--color-text-secondary)]" />
          </span>
        ) : (
          MODE_OPTIONS.map((m) => {
            const active = op.mode === m
            return (
              <button
                key={m}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (!active) onSetMode(op, m)
                }}
                className={`h-8 rounded-full px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${active ? 'bg-[var(--color-text-primary)] text-[var(--color-background)]' : 'bg-[var(--color-background-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]/80 hover:text-[var(--color-text-primary)]'}`}
              >
                {m}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export function PackagePermissionsDialog({
  open,
  onOpenChange,
  packageName,
}: PackagePermissionsDialogProps) {
  const [report, setReport] = useState<PackagePermissionsReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyKey, setBusyKey] = useState<BusyKey>(null)
  const [activeTab, setActiveTab] = useState<Tab>('runtime')

  const fetchReport = useCallback(async () => {
    if (!packageName) return
    setLoading(true)
    setError(null)
    try {
      const r = await getPackagePermissions(packageName)
      setReport(r)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.error('Failed to load permissions', { description: msg })
    } finally {
      setLoading(false)
    }
  }, [packageName])

  useEffect(() => {
    if (!open || !packageName) {
      setReport(null)
      setError(null)
      setQuery('')
      setBusyKey(null)
      return
    }
    void fetchReport()
  }, [open, packageName, fetchReport])

  const runtimePerms = useMemo(() => {
    if (!report) return []
    return report.permissions.filter((p) => p.isRuntime)
  }, [report])

  const installPerms = useMemo(() => {
    if (!report) return []
    return report.permissions.filter((p) => !p.isRuntime)
  }, [report])

  const filteredRuntime = useMemo(() => {
    if (!query.trim()) return runtimePerms
    const q = query.toLowerCase()
    return runtimePerms.filter((p) => p.name.toLowerCase().includes(q) || p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q))
  }, [runtimePerms, query])

  const filteredInstall = useMemo(() => {
    if (!query.trim()) return installPerms
    const q = query.toLowerCase()
    return installPerms.filter((p) => p.name.toLowerCase().includes(q) || p.label.toLowerCase().includes(q))
  }, [installPerms, query])

  const filteredAppOps = useMemo(() => {
    if (!report) return []
    if (!query.trim()) return report.appOps
    const q = query.toLowerCase()
    return report.appOps.filter((o) => o.name.toLowerCase().includes(q) || o.label.toLowerCase().includes(q))
  }, [report, query])

  const groupedRuntime = useMemo(() => groupPermissions(filteredRuntime), [filteredRuntime])

  const handleTogglePerm = useCallback(
    async (perm: PackagePermission, granted: boolean) => {
      if (!report) return
      const key = `perm:${perm.name}`
      setBusyKey(key)
      try {
        const msg = await setPackagePermission(report.packageName, perm.name, granted)
        toast.success(msg || `${granted ? 'Granted' : 'Revoked'} ${perm.label}`)
        setReport((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            permissions: prev.permissions.map((p) => (p.name === perm.name ? { ...p, isGranted: granted } : p)),
          }
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        toast.error(`Failed to ${granted ? 'grant' : 'revoke'} permission`, { description: msg })
      } finally {
        setBusyKey(null)
      }
    },
    [report],
  )

  const handleSetAppOp = useCallback(
    async (op: PackageAppOp, mode: string) => {
      if (!report) return
      const key = `appop:${op.name}`
      setBusyKey(key)
      try {
        const msg = await setPackageAppOp(report.packageName, op.name, mode)
        toast.success(msg || `Set ${op.label} to ${mode}`)
        setReport((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            appOps: prev.appOps.map((o) => (o.name === op.name ? { ...o, mode } : o)),
          }
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        toast.error('Failed to set app op', { description: msg })
      } finally {
        setBusyKey(null)
      }
    },
    [report],
  )

  return (
    <Dialog
      isOpen={open}
      onOpenChange={onOpenChange}
      width={680}
      padding={0}
      className="overflow-hidden rounded-2xl border border-border/50 bg-card/70 backdrop-blur-2xl supports-backdrop-filter:bg-card/80"
    >
      <div className="dashboard-scale flex max-h-[86vh] flex-col">
        <DialogHeader
          className="border-b border-border/40 px-6 py-5"
          onOpenChange={onOpenChange}
          title={
            <span className="flex items-center gap-2.5">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                <IconShieldLock size={18} stroke={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block max-w-[420px] truncate text-[18px] font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]">
                  {packageName}
                </span>
                <span className="block text-[13px] font-normal text-[var(--color-text-secondary)]">
                  {report ? `${runtimePerms.length} runtime · ${report.appOps.length} app ops · ${installPerms.length} install` : 'Loading permissions…'}
                </span>
              </span>
            </span>
          }
        />
        <div className="flex justify-end border-b border-border/40 bg-[var(--color-background)]/40 px-6 py-2">
          <Button
            label="Refresh"
            icon={<IconRefresh size={18} stroke={1.75} />}
            variant="ghost"
            isIconOnly
            tooltip="Refresh permissions"
            isDisabled={loading}
            onClick={() => void fetchReport()}
          />
        </div>

        {/* search + tabs */}
        <div className="border-b border-border/40 bg-[var(--color-background)]/40 px-6 py-3">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search permissions, app ops…"
                aria-label="Search permissions"
                className="h-10 w-full rounded-full bg-[var(--color-background-muted)] pl-10 pr-4 text-[14px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              />
            </div>

            <div className="flex gap-1.5">
              {(['runtime', 'appops', 'install'] as Tab[]).map((t) => {
                const isActive = activeTab === t
                const count = t === 'runtime' ? filteredRuntime.length : t === 'appops' ? filteredAppOps.length : filteredInstall.length
                const label = t === 'runtime' ? `Runtime` : t === 'appops' ? `App ops` : `Install`
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveTab(t)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${isActive ? 'bg-[var(--color-text-primary)] text-[var(--color-background)]' : 'bg-[var(--color-background-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                  >
                    {label}
                    <span className={`ml-0.5 inline-flex min-w-5 justify-center rounded-full px-1.5 text-[11px] ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-text-secondary)]/15 text-[var(--color-text-secondary)]'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="space-y-3 px-4 py-4">
              <Skeleton height={56} width="100%" radius={4} />
              <Skeleton height={56} width="100%" radius={4} />
              <Skeleton height={56} width="100%" radius={4} />
              <Skeleton height={40} width="60%" radius={3} />
            </div>
          ) : error && !report ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)]">
                <IconAlertTriangle size={22} stroke={1.75} />
              </span>
              <p className="max-w-[36ch] text-[15px] font-semibold text-[var(--color-text-primary)]">Failed to load permissions</p>
              <p className="max-w-[42ch] text-[13px] text-[var(--color-text-secondary)]">{error}</p>
              <Button label="Retry" variant="secondary" onClick={() => void fetchReport()} />
            </div>
          ) : report ? (
            <>
              {activeTab === 'runtime' && (
                <div className="space-y-6 px-2 py-2">
                  {groupedRuntime.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                      <IconInfoCircle size={22} className="text-[var(--color-text-secondary)]" />
                      <p className="text-[14px] text-[var(--color-text-secondary)]">{query ? `No runtime permissions match "${query}"` : 'No runtime permissions declared'}</p>
                    </div>
                  ) : (
                    groupedRuntime.map(([group, perms]) => (
                      <div key={group}>
                        <div className="sticky top-0 z-10 -mx-2 bg-card/90 px-4 py-2 backdrop-blur-md">
                          <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">{group}</h3>
                        </div>
                        <div className="space-y-1">
                          {perms.map((p) => (
                            <PermissionRow key={p.name} perm={p} busy={busyKey === `perm:${p.name}`} onToggle={handleTogglePerm} />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'appops' && (
                <div className="space-y-1 px-2 py-2">
                  {!report.appOpsSupported && (
                    <div className="mx-2 mb-3 flex items-start gap-2 rounded-xl bg-[var(--color-warning)]/10 px-4 py-3 text-[13px] text-[var(--color-warning)]">
                      <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>App ops not available on this device. Requires Android 6+ and cmd appops support.</span>
                    </div>
                  )}
                  {filteredAppOps.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                      <IconInfoCircle size={22} className="text-[var(--color-text-secondary)]" />
                      <p className="text-[14px] text-[var(--color-text-secondary)]">{query ? `No app ops match "${query}"` : report.appOpsSupported ? 'No app ops returned' : 'App ops unavailable'}</p>
                    </div>
                  ) : (
                    filteredAppOps.map((op) => (
                      <AppOpRow key={op.name} op={op} busy={busyKey === `appop:${op.name}`} onSetMode={handleSetAppOp} />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'install' && (
                <div className="space-y-1 px-2 py-2">
                  {filteredInstall.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                      <IconInfoCircle size={22} className="text-[var(--color-text-secondary)]" />
                      <p className="text-[14px] text-[var(--color-text-secondary)]">{query ? `No install permissions match "${query}"` : 'No install permissions'}</p>
                    </div>
                  ) : (
                    filteredInstall.map((p) => (
                      <div key={p.name} className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 hover:bg-[var(--color-background-muted)]/60">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">{p.label}</p>
                          <p className="truncate text-[12px] text-[var(--color-text-secondary)]">{p.name}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[var(--color-success)]/12 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-success)]">granted</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="border-t border-border/40 px-6 py-3 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
          <span className="font-medium">Note:</span> Grant only works for declared runtime permissions. Special access like draw over other apps, all files access, and usage access is controlled via App ops tab. Some OEM ROMs block app ops changes.
        </div>
      </div>
    </Dialog>
  )
}
