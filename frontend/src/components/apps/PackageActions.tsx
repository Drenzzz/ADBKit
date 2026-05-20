import {
  MoreHorizontal,
  Info,
  Play,
  Square,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Eraser,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PackageActionsProps {
  packageName: string
  isEnabled: boolean
  isBusy: boolean
  onDetails: (name: string) => void
  onLaunch: (name: string) => void
  onForceStop: (name: string) => void
  onToggleEnabled: (name: string) => void
  onClearData: (name: string) => void
  onPullApk: (name: string) => void
  onUninstall: (name: string) => void
}

export function PackageActions({
  packageName,
  isEnabled,
  isBusy,
  onDetails,
  onLaunch,
  onForceStop,
  onToggleEnabled,
  onClearData,
  onPullApk,
  onUninstall,
}: PackageActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isBusy}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onDetails(packageName)}>
          <Info className="mr-2 h-4 w-4" />
          Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLaunch(packageName)}>
          <Play className="mr-2 h-4 w-4" />
          Launch
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForceStop(packageName)}>
          <Square className="mr-2 h-4 w-4" />
          Force Stop
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleEnabled(packageName)}>
          {isEnabled ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Disable
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Enable
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onClearData(packageName)}>
          <Eraser className="mr-2 h-4 w-4" />
          Clear Data
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPullApk(packageName)}>
          <Download className="mr-2 h-4 w-4" />
          Export APK
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onUninstall(packageName)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Uninstall
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
