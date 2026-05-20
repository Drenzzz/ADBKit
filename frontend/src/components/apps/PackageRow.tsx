import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { PackageActions } from './PackageActions'
import type { PackageInfo } from '@/lib/types'

interface PackageRowProps {
  pkg: PackageInfo
  isSelected: boolean
  isBusy: boolean
  onToggleSelect: (name: string) => void
  onDetails: (name: string) => void
  onLaunch: (name: string) => void
  onForceStop: (name: string) => void
  onToggleEnabled: (name: string) => void
  onClearData: (name: string) => void
  onPullApk: (name: string) => void
  onUninstall: (name: string) => void
}

export function PackageRow({
  pkg,
  isSelected,
  isBusy,
  onToggleSelect,
  onDetails,
  onLaunch,
  onForceStop,
  onToggleEnabled,
  onClearData,
  onPullApk,
  onUninstall,
}: PackageRowProps) {
  return (
    <tr className="group border-b border-border/50 transition-colors hover:bg-muted/50">
      <td className="w-10 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(pkg.packageName)}
          disabled={isBusy}
        />
      </td>
      <td className="px-3 py-2">
        <span className="text-sm font-medium">{pkg.packageName}</span>
      </td>
      <td className="w-24 px-3 py-2">
        <Badge variant={pkg.isEnabled ? 'default' : 'secondary'} className="text-[10px]">
          {pkg.isEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </td>
      <td className="w-20 px-3 py-2">
        <Badge variant="outline" className="text-[10px]">
          {pkg.isSystemApp ? 'System' : 'User'}
        </Badge>
      </td>
      <td className="w-10 px-2 py-2">
        <PackageActions
          packageName={pkg.packageName}
          isEnabled={pkg.isEnabled}
          isBusy={isBusy}
          onDetails={onDetails}
          onLaunch={onLaunch}
          onForceStop={onForceStop}
          onToggleEnabled={onToggleEnabled}
          onClearData={onClearData}
          onPullApk={onPullApk}
          onUninstall={onUninstall}
        />
      </td>
    </tr>
  )
}
