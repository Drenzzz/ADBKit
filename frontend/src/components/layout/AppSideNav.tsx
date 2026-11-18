import { useLocation, useNavigate } from 'react-router-dom'
import {
  IconLayoutDashboard as LayoutDashboard,
  IconDeviceMobile as Smartphone,
  IconBox as Package,
  IconFolderOpen as FolderOpen,
  IconBolt as Zap,
  IconTerminal as Terminal,
  IconCast as MonitorPlay,
  IconSettings as Settings,
} from '@tabler/icons-react'
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav'
import { AppSideNavFooter } from './AppSideNavFooter'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/devices', label: 'Devices', icon: Smartphone },
  { to: '/apps', label: 'Apps', icon: Package },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/flasher', label: 'Flasher', icon: Zap },
  { to: '/terminal', label: 'Terminal', icon: Terminal },
  { to: '/scrcpy', label: 'Scrcpy', icon: MonitorPlay },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppSideNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <SideNav collapsible={{ defaultIsCollapsed: true, hasButton: false }}>
      <SideNavSection title="Workspace" isHeaderHidden>
        {NAV_ITEMS.map((item) => {
          const isSelected =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)

          return (
            <SideNavItem
              key={item.to}
              label={item.label}
              icon={item.icon}
              isSelected={isSelected}
              onClick={() => navigate(item.to)}
            />
          )
        })}
      </SideNavSection>
      <SideNavSection title="Device" isHeaderHidden>
        <AppSideNavFooter />
      </SideNavSection>
    </SideNav>
  )
}
