import { Outlet } from 'react-router-dom'
import { BottomDock } from './BottomDock'
import { CommandPalette } from '@/components/common/CommandPalette'

export function AppShell() {
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
