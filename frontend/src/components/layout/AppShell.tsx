import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomDock } from './BottomDock'
import { CommandPalette } from '@/components/common/CommandPalette'
import { SetupWizard } from '@/components/setup/SetupWizard'
import { getSetupState } from '@/services/binaryService'
import { getAppConfig } from '@/services/settingsService'
import { useUIStore } from '@/stores/useUIStore'

function applyThemeClass(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function StartupLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        <span className="text-xs text-muted-foreground">Loading…</span>
      </div>
    </div>
  )
}

export function AppShell() {
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
          applyThemeClass(nextTheme)
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
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <main className="flex-1 overflow-y-auto pb-16">
          <SetupWizard onSkipToApp={() => setSetupComplete(true)} />
        </main>
        <BottomDock />
        <CommandPalette />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <main className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 w-full flex flex-col p-6 pb-24 overflow-y-auto">
          <Outlet />
        </div>
      </main>
      <BottomDock />
      <CommandPalette />
    </div>
  )
}
