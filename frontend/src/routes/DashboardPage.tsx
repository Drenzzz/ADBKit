import { DeviceListCard } from '@/components/dashboard/DeviceListCard'
import { DeviceInfoCard } from '@/components/dashboard/DeviceInfoCard'
import { BinaryStatusCard } from '@/components/dashboard/BinaryStatusCard'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Device overview, quick actions, and binary status.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DeviceListCard />
        </div>
        <BinaryStatusCard />
      </div>
      <DeviceInfoCard />
    </div>
  )
}
