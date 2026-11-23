import { lazy, Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppSideNav } from './AppSideNav'
import { SetupWizard } from '@/components/setup/SetupWizard'
import { getSetupState } from '@/services/binaryService'
import { getAppConfig } from '@/services/settingsService'
import { useUIStore } from '@/stores/useUIStore'
import { useDeviceSync } from '@/hooks/useDeviceSync'
import { cn } from '@/lib/utils'

const CommandPalette = lazy(() =>
  import('@/components/common/CommandPalette').then(({ CommandPalette: Component }) => ({ default: Component })),
)

function StartupLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <img src="/logo.webp" alt="ADBKit" className="h-12 w-12 object-contain opacity-80" />
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none" />
        <span className="text-xs text-muted-foreground">Loading…</span>
      </div>
    </div>
  )
}

function DeviceSync() {
  useDeviceSync()
  return null
}

export function AppShell() {
  const location = useLocation()
  const isNoGlobalScroll = ['/apps', '/files', '/devices', '/terminal', '/scrcpy', '/settings'].includes(location.pathname)

  const [setupChecked, setSetupChecked] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const setStartupLoading = useUIStore((s) => s.setStartupLoading)
  const setUiTheme = useUIStore((s) => s.setTheme)
  const currentTheme = useUIStore((s) => s.theme)

  useEffect(() => {
    let cancelled = false
    Promise.all([getSetupState(), getAppConfig()])
      .then(([state, config]) => {
        if (cancelled) return
        const nextTheme = config.theme === 'light' ? 'light' : 'dark'
        if (nextTheme !== currentTheme) {
          setUiTheme(nextTheme)
        }
        setSetupComplete(state.setupCompleted)
        setSetupChecked(true)
        setStartupLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setSetupComplete(false)
        setSetupChecked(true)
        setStartupLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [setStartupLoading, setUiTheme, currentTheme])

  if (!setupChecked) return <StartupLoader />

  if (!setupComplete) {
    return (
      <div data-file-drop-target="app" className="flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SetupWizard onComplete={() => setSetupComplete(true)} />
        </main>
      </div>
    )
  }

  return (
    <>
      <DeviceSync />
      <div data-file-drop-target="app" className="flex h-screen overflow-hidden bg-background text-foreground">
        <AppSideNav />
        <main className="flex min-w-0 flex-1 flex-col p-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div
              className={cn(
                'flex min-h-0 flex-1 flex-col',
                isNoGlobalScroll ? 'overflow-hidden' : 'overflow-y-auto',
              )}
            >
              <Outlet />
            </div>
          </div>
        </main>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </div>
    </>
  )
}
