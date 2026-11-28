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
  IconCheck,
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageName: string
}

type BusyKey = string | null
type Tab = 'runtime' | 'appops' | 'install'
const MODES = ['allow', 'deny', 'ignore', 'default'] as const

function groupPermissions(perms: PackagePermission[]) {
  const m = new Map<string, PackagePermission[]>()
  for (const p of perms) {
    const k = p.group || 'Other'
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(p)
  }
  const order = ['Camera','Microphone','Location','Phone','SMS','Contacts','Calendar','Media','Storage','Nearby','Notifications','Sensors','Other']
  return Array.from(m.entries()).sort((a,b)=>{
    const ia = order.indexOf(a[0]); const ib = order.indexOf(b[0])
    if (ia !== -1 && ib !== -1) return ia-ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a[0].localeCompare(b[0])
  })
}

function StatusDot({ granted }: { granted: boolean }) {
  return <span aria-hidden className={`inline-block size-1.5 rounded-full ${granted ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-secondary)]/50]'}`} style={{ background: granted ? 'var(--color-success)' : 'var(--color-text-secondary)', opacity: granted ? 1 : 0.45 }} />
}

function PermissionRow({
  perm, busy, onToggle,
}: {
  perm: PackagePermission
  busy: boolean
  onToggle: (p: PackagePermission, g: boolean) => void
}) {
  return (
    <div className="group flex items-center justify-between gap-4 rounded-[12px] border border-transparent px-4 py-3.5 transition-[background,border-color] hover:border-border/40 hover:bg-card">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <StatusDot granted={perm.isGranted} />
          <span className="truncate text-[14px] font-medium leading-tight text-[var(--color-text-primary)]">{perm.label}</span>
          <span className="truncate text-[12px] font-normal text-[var(--color-text-secondary)]">{perm.isGranted ? 'granted' : 'denied'}</span>
        </div>
        <p className="ml-[18px] mt-1 truncate text-[11px] leading-relaxed text-[var(--color-text-secondary)]/80">{perm.name}</p>
      </div>
      <div className="shrink-0">
        {busy ? <IconLoader2 size={16} className="animate-spin text-[var(--color-text-secondary)]" /> : (
          <Switch label={`${perm.label} permission`} isLabelHidden value={perm.isGranted} onChange={(v)=>onToggle(perm, v as boolean)} />
        )}
      </div>
    </div>
  )
}

function AppOpRow({
  op, busy, onSetMode,
}: {
  op: PackageAppOp
  busy: boolean
  onSetMode: (o: PackageAppOp, m: string) => void
}) {
  const normalized = op.mode.toLowerCase()
  return (
    <div className="group flex flex-col gap-3 rounded-[12px] border border-transparent px-4 py-3.5 transition-[background,border-color] hover:border-border/40 hover:bg-card sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span className={`inline-block size-1.5 rounded-full ${normalized === 'allow' ? '' : 'opacity-50'}`} style={{ background: normalized === 'allow' ? 'var(--color-success)' : normalized === 'deny' ? 'var(--color-error)' : 'var(--color-text-secondary)' }} />
          <span className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">{op.label}</span>
          <span className="text-[12px] text-[var(--color-text-secondary)]">{normalized}</span>
        </div>
        <p className="ml-[18px] mt-1 truncate text-[11px] text-[var(--color-text-secondary)]/80">{op.name}</p>
      </div>
      <div className="flex shrink-0 items-center">
        {busy ? (
          <span className="inline-flex h-8 w-[160px] items-center justify-center rounded-full bg-background-muted"><IconLoader2 size={14} className="animate-spin text-[var(--color-text-secondary)]" /></span>
        ) : (
          <div role="group" aria-label={`${op.label} mode`} className="inline-flex items-center rounded-full bg-[var(--color-background-muted)] p-1">
            {MODES.map((m) => {
              const active = normalized === m
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={active}
                  onClick={()=>{ if (!active) onSetMode(op, m) }}
                  className={`min-w-[48px] rounded-full px-3 py-1.5 text-[12px] font-medium leading-none transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${active ? 'bg-[var(--color-text-primary)] text-[var(--color-background)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                >{m}</button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function PackagePermissionsDialog({ open, onOpenChange, packageName }: Props) {
  const [report, setReport] = useState<PackagePermissionsReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyKey, setBusyKey] = useState<BusyKey>(null)
  const [activeTab, setActiveTab] = useState<Tab>('runtime')

  const fetchReport = useCallback(async () => {
    if (!packageName) return
    setLoading(true); setError(null)
    try { setReport(await getPackagePermissions(packageName)) }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg); toast.error('Failed to load permissions', { description: msg })
    } finally { setLoading(false) }
  }, [packageName])

  useEffect(() => {
    if (!open || !packageName) { setReport(null); setError(null); setQuery(''); setBusyKey(null); return }
    void fetchReport()
  }, [open, packageName, fetchReport])

  const runtimePerms = useMemo(()=> report?.permissions.filter(p=>p.isRuntime) ?? [], [report])
  const installPerms = useMemo(()=> report?.permissions.filter(p=>!p.isRuntime) ?? [], [report])

  const filteredRuntime = useMemo(()=>{
    const q = query.trim().toLowerCase(); if (!q) return runtimePerms
    return runtimePerms.filter(p=> p.name.toLowerCase().includes(q) || p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q))
  }, [runtimePerms, query])
  const filteredInstall = useMemo(()=>{
    const q = query.trim().toLowerCase(); if (!q) return installPerms
    return installPerms.filter(p=> p.name.toLowerCase().includes(q) || p.label.toLowerCase().includes(q))
  }, [installPerms, query])
  const filteredAppOps = useMemo(()=>{
    if (!report) return []; const q = query.trim().toLowerCase(); if (!q) return report.appOps
    return report.appOps.filter(o=> o.name.toLowerCase().includes(q) || o.label.toLowerCase().includes(q))
  }, [report, query])

  const groupedRuntime = useMemo(()=> groupPermissions(filteredRuntime), [filteredRuntime])

  const handleTogglePerm = useCallback(async (perm: PackagePermission, granted: boolean) => {
    if (!report) return
    setBusyKey(`perm:${perm.name}`)
    try {
      const msg = await setPackagePermission(report.packageName, perm.name, granted)
      toast.success(msg || `${granted ? 'Granted' : 'Revoked'} ${perm.label}`)
      setReport(prev=> prev ? { ...prev, permissions: prev.permissions.map(p=> p.name===perm.name ? { ...p, isGranted: granted } : p)} : prev)
    } catch (e) {
      toast.error(`Failed to ${granted ? 'grant' : 'revoke'} permission`, { description: e instanceof Error ? e.message : String(e) })
    } finally { setBusyKey(null) }
  }, [report])

  const handleSetAppOp = useCallback(async (op: PackageAppOp, mode: string) => {
    if (!report) return
    setBusyKey(`appop:${op.name}`)
    try {
      const msg = await setPackageAppOp(report.packageName, op.name, mode)
      toast.success(msg || `Set ${op.label} to ${mode}`)
      setReport(prev=> prev ? { ...prev, appOps: prev.appOps.map(o=> o.name===op.name ? { ...o, mode } : o)} : prev)
    } catch (e) {
      toast.error('Failed to set app op', { description: e instanceof Error ? e.message : String(e) })
    } finally { setBusyKey(null) }
  }, [report])

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} width={640} padding={0} className="overflow-hidden rounded-2xl border border-border/40 bg-card/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/80">
      <div className="flex max-h-[84vh] flex-col">
        <DialogHeader
          className="border-b border-border/30 px-6 py-4"
          onOpenChange={onOpenChange}
          title={
            <span className="flex items-center gap-3">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-background-muted text-[var(--color-text-secondary)]">
                <IconShieldLock size={16} stroke={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block max-w-[400px] truncate text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)]">{packageName}</span>
                <span className="block text-[12px] font-normal text-[var(--color-text-secondary)]">{report ? `${runtimePerms.length} runtime · ${report.appOps.length} app ops · ${installPerms.length} install` : 'Loading permissions…'}</span>
              </span>
            </span>
          }
        />

        <div className="border-b border-border/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IconSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              <input
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Search permissions, app ops"
                aria-label="Search permissions"
                className="h-9 w-full rounded-full bg-background-muted pl-9 pr-3 text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]/70 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              />
            </div>
            <Button label="Refresh" icon={<IconRefresh size={16} stroke={1.75} />} variant="ghost" isIconOnly tooltip="Refresh" isDisabled={loading} onClick={()=>void fetchReport()} />
          </div>

          <div className="mt-3 inline-flex rounded-full bg-background-muted p-1">
            {(['runtime','appops','install'] as Tab[]).map((t)=>{
              const active = activeTab===t
              const cnt = t==='runtime' ? filteredRuntime.length : t==='appops' ? filteredAppOps.length : filteredInstall.length
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={()=>setActiveTab(t)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${active ? 'bg-[var(--color-text-primary)] text-[var(--color-background)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                >
                  <span>{t === 'runtime' ? 'Runtime' : t === 'appops' ? 'App ops' : 'Install'}</span>
                  <span className={`min-w-4 text-[10px] tabular-nums ${active ? 'text-white/70' : 'text-[var(--color-text-secondary)]/70'}`}>{cnt}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {loading ? (
            <div className="space-y-2 px-2 py-3">
              <Skeleton height={48} width="100%" radius={2} />
              <Skeleton height={48} width="100%" radius={2} />
              <Skeleton height={48} width="100%" radius={2} />
            </div>
          ) : error && !report ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)]"><IconAlertTriangle size={18} /></span>
              <p className="text-[14px] font-medium text-[var(--color-text-primary)]">Failed to load</p>
              <p className="max-w-[38ch] text-[12px] text-[var(--color-text-secondary)]">{error}</p>
              <Button label="Retry" variant="secondary" onClick={()=>void fetchReport()} />
            </div>
          ) : report ? (
            <>
              {activeTab==='runtime' && (
                <div className="space-y-5 px-1 py-1">
                  {groupedRuntime.length===0 ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-center">
                      <IconInfoCircle size={18} className="text-[var(--color-text-secondary)]" />
                      <p className="text-[13px] text-[var(--color-text-secondary)]">{query ? `No matches for "${query}"` : 'No runtime permissions'}</p>
                    </div>
                  ) : groupedRuntime.map(([group, perms])=>(
                    <div key={group}>
                      <div className="sticky top-0 z-10 -mx-1 bg-card/80 px-3 py-2 backdrop-blur-md">
                        <h3 className="text-[11px] font-medium tracking-wide text-[var(--color-text-secondary)]">{group} · {perms.length}</h3>
                      </div>
                      <div className="space-y-0.5">
                        {perms.map(p=> <PermissionRow key={p.name} perm={p} busy={busyKey===`perm:${p.name}`} onToggle={handleTogglePerm} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab==='appops' && (
                <div className="space-y-0.5 px-1 py-1">
                  {!report.appOpsSupported && (
                    <div className="mx-1 mb-3 flex gap-2 rounded-xl bg-[var(--color-warning)]/10 px-3 py-2.5 text-[12px] text-[var(--color-text-secondary)]">
                      <IconAlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <span>App ops not available on this device.</span>
                    </div>
                  )}
                  {filteredAppOps.length===0 ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-center">
                      <IconInfoCircle size={18} className="text-[var(--color-text-secondary)]" />
                      <p className="text-[13px] text-[var(--color-text-secondary)]">{query ? `No matches for "${query}"` : 'No app ops'}</p>
                    </div>
                  ) : filteredAppOps.map(op=> <AppOpRow key={op.name} op={op} busy={busyKey===`appop:${op.name}`} onSetMode={handleSetAppOp} />)}
                </div>
              )}

              {activeTab==='install' && (
                <div className="space-y-0.5 px-1 py-1">
                  {filteredInstall.length===0 ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-center">
                      <IconInfoCircle size={18} className="text-[var(--color-text-secondary)]" />
                      <p className="text-[13px] text-[var(--color-text-secondary)]">{query ? `No matches for "${query}"` : 'No install permissions'}</p>
                    </div>
                  ) : filteredInstall.map(p=>(
                    <div key={p.name} className="flex items-center justify-between gap-4 rounded-[12px] px-4 py-3 text-[var(--color-text-primary)] hover:bg-card">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{p.label}</p>
                        <p className="truncate text-[11px] text-[var(--color-text-secondary)]/80">{p.name}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]"><IconCheck size={12} /> granted</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="border-t border-border/30 px-6 py-3 text-[11px] leading-relaxed text-[var(--color-text-secondary)]/80">
          Grant works only for declared runtime permissions. Special access like draw over other apps or all files access is via App ops. Some OEM ROMs block app ops changes.
        </div>
      </div>
    </Dialog>
  )
}
