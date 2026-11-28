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
  IconShieldLock,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@astryxdesign/core/DropdownMenu'

interface PackageActionsProps {
  packageName: string
  isEnabled: boolean
  isBusy: boolean
  onPermissions: (name: string) => void
  onDetails: (name: string) => void
  onLaunch: (name: string) => void
  onForceStop: (name: string) => void
  onToggleEnabled: (name: string) => void
  onClearData: (name: string) => void
  onPullApk: (name: string) => void
  onUninstall: (name: string) => void
}

const ITEM = 'px-4 py-2.5 text-[15px] font-medium'
const ICON = 'size-[18px] stroke-[1.75]'

export function PackageActions({
  packageName,
  isEnabled,
  isBusy,
  onPermissions,
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
    <DropdownMenu
      isMenuOpen={open}
      onOpenChange={setOpen}
      placement="below"
      alignment="end"
      menuWidth={256}
      renderTrigger={(props) => (
        <button
          {...props}
          type="button"
          disabled={isBusy}
          aria-label={`Actions for ${packageName}`}
          className="flex size-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          <IconDotsVertical size={20} stroke={1.75} />
        </button>
      )}
      header={
        <div className="border-b border-border/40 px-4 pb-2.5 pt-2">
          <p className="truncate text-[14px] font-bold tracking-tight text-[var(--color-text-primary)]">
            {packageName}
          </p>
          <p className="mt-0.5 text-[14px] text-[var(--color-text-secondary)]">
            {isEnabled ? 'Enabled' : 'Disabled'} app
          </p>
        </div>
      }
    >
      <DropdownMenuItem className={ITEM} icon={<IconShieldLock className={ICON} />} label="Permissions" onClick={run(onPermissions)} />
      <DropdownMenuItem className={ITEM} icon={<IconInfoCircle className={ICON} />} label="Details" onClick={run(onDetails)} />
      <DropdownMenuItem className={ITEM} icon={<IconPlayerPlay className={ICON} />} label="Launch" onClick={run(onLaunch)} />
      <DropdownMenuItem className={ITEM} icon={<IconSquare className={ICON} />} label="Force stop" onClick={run(onForceStop)} />
      <DropdownMenuDivider className="my-1.5" />
      <DropdownMenuItem
        className={ITEM}
        icon={isEnabled ? <IconEyeOff className={ICON} /> : <IconEye className={ICON} />}
        label={isEnabled ? 'Disable' : 'Enable'}
        onClick={run(onToggleEnabled)}
      />
      <DropdownMenuItem
        className={ITEM}
        icon={<IconEraser className={ICON} />}
        label={
          <span className="flex w-full items-center gap-2">
            Clear data
            <span className="ml-auto text-[14px] text-[var(--color-text-secondary)]">data & cache</span>
          </span>
        }
        onClick={run(onClearData)}
      />
      <DropdownMenuItem className={ITEM} icon={<IconDownload className={ICON} />} label="Export APK" onClick={run(onPullApk)} />
      <DropdownMenuDivider className="my-1.5" />
      <DropdownMenuItem
        className={ITEM}
        variant="destructive"
        icon={<IconTrash className={ICON} />}
        label={
          <span className="flex w-full items-center gap-2">
            Uninstall
            <span className="ml-auto text-[14px] opacity-70">removes app</span>
          </span>
        }
        onClick={run(onUninstall)}
      />
    </DropdownMenu>
  )
}