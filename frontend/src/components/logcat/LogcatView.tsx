import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { IconArticle, IconFilter } from '@tabler/icons-react'
import { useLogcatStore } from '@/stores/useLogcatStore'
import { LogcatEntry } from './LogcatEntry'

const ROW_HEIGHT = 32

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
      <div className="flex h-full flex-col items-center justify-center gap-3 select-none">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-background-card)] text-[var(--color-text-secondary)]">
          <IconArticle size={24} stroke={1.75} />
        </div>
        <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">No logcat output</p>
        <p className="max-w-xs text-center text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          Start a logcat stream to see device logs here
        </p>
      </div>
    )
  }

  if (filteredLogs.length === 0 && logs.length > 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 select-none">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-background-card)] text-[var(--color-text-secondary)]">
          <IconFilter size={24} stroke={1.75} />
        </div>
        <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">No matching logs</p>
        <p className="max-w-xs text-center text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          Try adjusting the level, tag, or message filter
        </p>
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
