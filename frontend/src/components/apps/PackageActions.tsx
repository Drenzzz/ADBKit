import { useState } from 'react'
import {
  IconDotsVertical,
  IconPlayerPlay,
  IconSquare,
  IconEye,
  IconEyeOff,
  IconTrash,
  IconDownload,
  IconEraser,
  IconInfoCircle,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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

const ITEM = 'gap-3.5 px-4 py-2.5 text-[15px] font-medium transition-[background-color,padding] duration-150 ease-out data-highlighted:pl-5'
const ICON = 'size-[18px] stroke-[1.75] transition-transform duration-150 group-hover:scale-110'

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
  const [open, setOpen] = useState(false)

  const run = (fn: (name: string) => void) => () => {
    setOpen(false)
    fn(packageName)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="flex size-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        disabled={isBusy}
        aria-label={`Actions for ${packageName}`}
      >
        <IconDotsVertical size={20} stroke={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-2xl border-border/50 bg-card/95 p-1.5 backdrop-blur-2xl"
      >
        <div className="border-b border-border/40 px-4 pb-2.5 pt-2">
          <p className="truncate text-[14px] font-bold tracking-tight text-[var(--color-text-primary)]">
            {packageName}
          </p>
          <p className="mt-0.5 text-[14px] text-[var(--color-text-secondary)]">
            {isEnabled ? 'Enabled' : 'Disabled'} app
          </p>
        </div>
        <DropdownMenuItem className={ITEM} onClick={run(onDetails)}>
          <IconInfoCircle className={ICON} /> Details
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={run(onLaunch)}>
          <IconPlayerPlay className={ICON} /> Launch
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={run(onForceStop)}>
          <IconSquare className={ICON} /> Force stop
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem className={ITEM} onClick={run(onToggleEnabled)}>
          {isEnabled
            ? <><IconEyeOff className={ICON} /> Disable</>
            : <><IconEye className={ICON} /> Enable</>}
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={run(onClearData)}>
          <IconEraser className={ICON} /> Clear data
          <span className="ml-auto text-[14px] text-[var(--color-text-secondary)]">data & cache</span>
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={run(onPullApk)}>
          <IconDownload className={ICON} /> Export APK
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          className={cn(ITEM, 'text-[var(--color-error)] focus:text-[var(--color-error)]')}
          onClick={run(onUninstall)}
        >
          <IconTrash className={ICON} /> Uninstall
          <span className="ml-auto text-[14px] opacity-70">removes app</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
