import {
  IconDeviceMobile as Smartphone,
  IconFolderOpen as FolderOpen,
  IconSearch as Search
} from "@tabler/icons-react"

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
