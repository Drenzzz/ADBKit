import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomDock } from './BottomDock'
import { CommandPalette } from '@/components/common/CommandPalette'
import { SetupWizard } from '@/components/setup/SetupWizard'
import { getSetupState } from '@/services/binaryService'
import { useUIStore } from '@/stores/useUIStore'

export function AppShell() {
  const [setupChecked, setSetupChecked] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const setStartupLoading = useUIStore((s) => s.setStartupLoading)

  useEffect(() => {
    let cancelled = false
    getSetupState()
      .then((state) => {
        if (!cancelled) {
          setSetupComplete(state.setupCompleted)
          setSetupChecked(true)
          setStartupLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSetupComplete(false)
          setSetupChecked(true)
          setStartupLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [setStartupLoading])

  if (!setupChecked) return null

  if (!setupComplete) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <main className="flex-1 overflow-y-auto pb-16">
          <SetupWizard />
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
