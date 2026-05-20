import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { PackageRow } from './PackageRow'
import { Skeleton } from '@/components/ui/skeleton'
import type { PackageInfo } from '@/lib/types'

interface PackageTableProps {
  packages: PackageInfo[]
  selectedPackages: string[]
  busyPackageName: string | null
  loading: boolean
  onToggleSelect: (name: string) => void
  onToggleAll: (names: string[]) => void
  onDetails: (name: string) => void
  onLaunch: (name: string) => void
  onForceStop: (name: string) => void
  onToggleEnabled: (name: string) => void
  onClearData: (name: string) => void
  onPullApk: (name: string) => void
  onUninstall: (name: string) => void
}

export function PackageTable({
  packages,
  selectedPackages,
  busyPackageName,
  loading,
  onToggleSelect,
  onToggleAll,
  onDetails,
  onLaunch,
  onForceStop,
  onToggleEnabled,
  onClearData,
  onPullApk,
  onUninstall,
}: PackageTableProps) {
  const allNames = packages.map((p) => p.packageName)
  const allSelected =
    allNames.length > 0 &&
    allNames.every((name) => selectedPackages.includes(name))

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 px-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => onToggleAll(allNames)}
            />
          </TableHead>
          <TableHead className="px-3">Package Name</TableHead>
          <TableHead className="w-24 px-3">Status</TableHead>
          <TableHead className="w-20 px-3">Type</TableHead>
          <TableHead className="w-10 px-2" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.map((pkg) => (
          <PackageRow
            key={pkg.packageName}
            pkg={pkg}
            isSelected={selectedPackages.includes(pkg.packageName)}
            isBusy={busyPackageName === pkg.packageName}
            onToggleSelect={onToggleSelect}
            onDetails={onDetails}
            onLaunch={onLaunch}
            onForceStop={onForceStop}
            onToggleEnabled={onToggleEnabled}
            onClearData={onClearData}
            onPullApk={onPullApk}
            onUninstall={onUninstall}
          />
        ))}
      </TableBody>
    </Table>
  )
}
