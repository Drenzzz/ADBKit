import { createHashRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/routes/DashboardPage'
import DevicesPage from '@/routes/DevicesPage'
import AppsPage from '@/routes/AppsPage'
import FilesPage from '@/routes/FilesPage'
import FlasherPage from '@/routes/FlasherPage'
import TerminalPage from '@/routes/TerminalPage'
import ScrcpyPage from '@/routes/ScrcpyPage'
import SettingsPage from '@/routes/SettingsPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'devices', element: <DevicesPage /> },
      { path: 'apps', element: <AppsPage /> },
      { path: 'files', element: <FilesPage /> },
      { path: 'flasher', element: <FlasherPage /> },
      { path: 'terminal', element: <TerminalPage /> },
      { path: 'scrcpy', element: <ScrcpyPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
