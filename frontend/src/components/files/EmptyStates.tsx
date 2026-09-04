import {
  IconDeviceMobile as Smartphone,
  IconFolderOpen as FolderOpen,
  IconSearch as Search,
  IconRefresh as Refresh,
  IconUsb as Usb
} from "@tabler/icons-react"
import { Button } from '@/components/ui/button'

export function NoDeviceState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Smartphone className="h-10 w-10" />
      <p className="text-sm font-medium">No device connected</p>
      <p className="text-xs">Connect an Android device to browse files.</p>
    </div>
  )
}

export function EmptyFolderState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <FolderOpen className="h-10 w-10" />
      <p className="text-sm font-medium">This folder is empty</p>
      <p className="text-xs">No files or directories found here.</p>
    </div>
  )
}

export function NoSearchResultsState({ term }: { term: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Search className="h-10 w-10" />
      <p className="text-sm font-medium">No results for &quot;{term}&quot;</p>
      <p className="text-xs">Try a different search term.</p>
    </div>
  )
}

export function UnmountedSdCardState({
  mountPoint,
  onRetry,
}: {
  mountPoint: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Usb className="h-10 w-10" />
      <p className="text-sm font-medium">SD card not available</p>
      <p className="text-xs text-center max-w-xs">
        The storage at <span className="font-mono text-[10px]">{mountPoint}</span> is not
        currently connected. The card may have been ejected or USB was disconnected.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 cursor-pointer">
        <Refresh className="h-3.5 w-3.5 mr-1.5" />
        Retry
      </Button>
    </div>
  )
}
