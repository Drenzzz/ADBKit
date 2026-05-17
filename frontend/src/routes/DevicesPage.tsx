import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeviceDetailPanel } from '@/components/devices/DeviceDetailPanel'
import { DeviceActions } from '@/components/devices/DeviceActions'
import { PerformancePanel } from '@/components/devices/PerformancePanel'
import { RenameDialog } from '@/components/devices/RenameDialog'
import { DeviceSidebar } from '@/components/devices/DeviceSidebar'
import { useDevices } from '@/hooks/useDevices'

export default function DevicesPage() {
  const { activeSerial, deviceInfo, nicknames } = useDevices()
  const [renameOpen, setRenameOpen] = useState(false)

  const displayName = activeSerial
    ? (nicknames[activeSerial] || deviceInfo?.model || deviceInfo?.product || activeSerial)
    : ''

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      <DeviceSidebar />

      <div className="flex flex-1 min-w-0 flex-col gap-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Device Manager</h1>
            <p className="text-sm text-muted-foreground">
              {displayName
                ? `Managing: ${displayName}`
                : 'Select a device from the sidebar.'}
            </p>
          </div>
          {activeSerial && (
            <Button variant="outline" size="sm" onClick={() => setRenameOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Rename
            </Button>
          )}
        </div>
        <DeviceActions />
        <PerformancePanel />
        <DeviceDetailPanel />

        {renameOpen && activeSerial && (
          <RenameDialog
            serial={activeSerial}
            currentNickname={nicknames[activeSerial] ?? ''}
            onClose={() => setRenameOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
