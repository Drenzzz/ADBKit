import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useLogcatStore } from '@/stores/useLogcatStore'
import { LogcatEntry } from './LogcatEntry'

const ROW_HEIGHT = 24

interface LogcatViewProps {
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function LogcatView({ scrollContainerRef }: LogcatViewProps) {
  const logs = useLogcatStore((state) => state.logs)
  const filter = useLogcatStore((state) => state.filter)
  const autoScroll = useLogcatStore((state) => state.autoScroll)
  const autoScrollRef = useRef(autoScroll)
  const scrollThrottleRef = useRef(false)

  autoScrollRef.current = autoScroll

  const filteredLogs = useMemo(() => {
    if (filter.levels.length === 6 && filter.tag === '' && filter.text === '') {
      return logs
    }

    const tagLower = filter.tag.toLowerCase()
    const textLower = filter.text.toLowerCase()

    return logs.filter((entry) => {
      if (!filter.levels.includes(entry.level)) {
        return false
      }

      if (tagLower !== '' && !entry.tag.toLowerCase().includes(tagLower)) {
        return false
      }

      if (textLower !== '' && !entry.message.toLowerCase().includes(textLower)) {
        return false
      }

      return true
    })
  }, [logs, filter.levels, filter.tag, filter.text])

  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  useEffect(() => {
    if (!autoScrollRef.current || filteredLogs.length === 0) {
      return
    }

    if (scrollThrottleRef.current) {
      return
    }

    scrollThrottleRef.current = true
    virtualizer.scrollToIndex(filteredLogs.length - 1, { align: 'end' })

    const timer = setTimeout(() => {
      scrollThrottleRef.current = false
    }, 200)

    return () => clearTimeout(timer)
  }, [filteredLogs.length, virtualizer])

  if (filteredLogs.length === 0 && logs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm font-medium">No logcat output</p>
          <p className="text-xs mt-1">Start a logcat stream to see device logs here</p>
        </div>
      </div>
    )
  }

  if (filteredLogs.length === 0 && logs.length > 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm font-medium">No matching logs</p>
          <p className="text-xs mt-1">Try adjusting your filter criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const entry = filteredLogs[virtualRow.index]
        if (!entry) return null

        return (
          <div
            key={entry.id}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translate3d(0, ${virtualRow.start}px, 0)`,
            }}
          >
            <LogcatEntry entry={entry} />
          </div>
        )
      })}
    </div>
  )
}
