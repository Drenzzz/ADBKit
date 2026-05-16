import { DeviceDetailPanel } from '@/components/devices/DeviceDetailPanel'
import { RebootActions } from '@/components/devices/RebootActions'
import { PerformancePanel } from '@/components/devices/PerformancePanel'

export default function DevicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Device Manager</h1>
        <p className="text-sm text-muted-foreground">
          Device details, reboot actions, and performance monitoring.
        </p>
      </div>
      <RebootActions />
      <PerformancePanel />
      <DeviceDetailPanel />
    </div>
  )
}
