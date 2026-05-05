import { Outlet } from 'react-router-dom'
import { BottomDock } from './BottomDock'

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <BottomDock />
    </div>
  )
}
