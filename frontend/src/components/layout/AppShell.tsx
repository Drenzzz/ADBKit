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

  if (!setupChecked) return null

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
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="mx-auto h-full w-full max-w-screen-2xl px-6 py-5">
          <Outlet />
        </div>
      </main>
      <BottomDock />
      <CommandPalette />
    </div>
  )
}
