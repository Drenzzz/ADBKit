import type { ScrcpySessionStatus } from '@/lib/types'
import { Smartphone, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface VideoContainerProps {
  sessionStatus: ScrcpySessionStatus
  error: string | null
  isStarting: boolean
}

export function VideoContainer({
  sessionStatus,
  error,
  isStarting,
}: VideoContainerProps) {
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Mirror session error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isStarting || sessionStatus === 'starting') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Starting scrcpy window…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-8 text-center">
        <Smartphone className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Mirror window open</h2>
        <p className="text-sm text-muted-foreground">
          Scrcpy is rendering in its own native window. Use the dock below
          to capture screenshots, record, or stop the session.
        </p>
        <Skeleton className="mt-2 h-2 w-40" />
      </div>
    </div>
  )
}
