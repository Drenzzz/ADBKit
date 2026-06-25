import { Smartphone, PackageSearch, Search } from 'lucide-react'

export function NoDeviceState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Smartphone className="h-10 w-10" />
      <p className="text-sm font-medium">No device connected</p>
      <p className="text-xs">Connect an Android device to manage packages.</p>
    </div>
  )
}

export function NoPackagesState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <PackageSearch className="h-10 w-10" />
      <p className="text-sm font-medium">No packages found</p>
      <p className="text-xs">
        {filter === 'user'
          ? 'No user-installed apps detected.'
          : filter === 'system'
            ? 'No system packages detected.'
            : 'No packages detected on this device.'}
      </p>
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
