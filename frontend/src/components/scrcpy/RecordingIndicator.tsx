import { useEffect, useState } from 'react'
import {
  IconCircle as Circle
} from "@tabler/icons-react"
import { Badge } from '@/components/ui/badge'

interface RecordingIndicatorProps {
  className?: string
  isRecording: boolean
  startedAt: number | null
  duration: string
}

function formatDuration(elapsed: number): string {
  const total = Math.max(0, Math.floor(elapsed / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

export function RecordingIndicator({
  className,
  isRecording,
  startedAt,
  duration,
}: RecordingIndicatorProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isRecording) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [isRecording])

  if (!isRecording) return null

  const elapsedMs = startedAt ? Date.now() - startedAt : 0
  const display = duration && duration !== '00:00' ? duration : formatDuration(elapsedMs)
  void tick

  return (
    <Badge
      variant="destructive"
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${className ?? ''}`}
    >
      <Circle className="h-2.5 w-2.5 fill-current animate-pulse" />
      REC {display}
    </Badge>
  )
}
