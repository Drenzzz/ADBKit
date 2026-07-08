import { lazy, Suspense, type ReactNode } from 'react'
import { createHashRouter } from 'react-router-dom'
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'

const DashboardPage = lazy(() => import('@/routes/DashboardPage'))
const DevicesPage = lazy(() => import('@/routes/DevicesPage'))
const AppsPage = lazy(() => import('@/routes/AppsPage'))
const FilesPage = lazy(() => import('@/routes/FilesPage'))
const FlasherPage = lazy(() => import('@/routes/FlasherPage'))
const TerminalPage = lazy(() => import('@/routes/TerminalPage'))
const ScrcpyPage = lazy(() => import('@/routes/ScrcpyPage'))
const SettingsPage = lazy(() => import('@/routes/SettingsPage'))

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <img src="/logo.webp" alt="ADBKit" className="h-10 w-10 object-contain opacity-80" />
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        <span className="text-xs text-muted-foreground">Loading…</span>
      </div>
    </div>
  )
}

function routeElement(page: ReactNode) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>{page}</Suspense>
    </RouteErrorBoundary>
  )
}

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: routeElement(<DashboardPage />),
      },
      {
        path: 'devices',
        element: routeElement(<DevicesPage />),
      },
      {
        path: 'apps',
        element: routeElement(<AppsPage />),
      },
      {
        path: 'files',
        element: routeElement(<FilesPage />),
      },
      {
        path: 'flasher',
        element: routeElement(<FlasherPage />),
      },
      {
        path: 'terminal',
        element: routeElement(<TerminalPage />),
      },
      {
        path: 'scrcpy',
        element: routeElement(<ScrcpyPage />),
      },
      {
        path: 'settings',
        element: routeElement(<SettingsPage />),
      },
    ],
  },
])
