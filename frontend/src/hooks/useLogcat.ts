import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { LogcatEntry } from '@/lib/types'
import { useLogcatStore } from '@/stores/useLogcatStore'
import { useDeviceStore } from '@/stores/useDeviceStore'
import {
  startLogcat,
  stopLogcat,
  saveLogcatToFile,
  onLogcatLine,
  onLogcatStatus,
} from '@/services/logcatService'

export function useLogcat() {
  const streamingSerial = useLogcatStore((state) => state.streamingSerial)
  const isStreaming = useLogcatStore((state) => state.isStreaming)
  const clearLogs = useLogcatStore((state) => state.clearLogs)
  const applyLineEvent = useLogcatStore((state) => state.applyLineEvent)
  const applyStatusEvent = useLogcatStore((state) => state.applyStatusEvent)
  const reset = useLogcatStore((state) => state.reset)

  const activeSerial = useDeviceStore((state) => state.activeSerial)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const activeSerialRef = useRef(activeSerial)
  const streamingSerialRef = useRef(streamingSerial)
  const isStreamingRef = useRef(isStreaming)

  useEffect(() => {
    activeSerialRef.current = activeSerial
    streamingSerialRef.current = streamingSerial
    isStreamingRef.current = isStreaming
  })

  const handleStart = useCallback(async () => {
    const serial = activeSerialRef.current
    if (!serial) {
      toast.error('No device selected')
      return
    }

    reset()

    try {
      await startLogcat(serial)
      toast.success(`Logcat started for ${serial}`)
    } catch (startError) {
      const message = startError instanceof Error
        ? startError.message
        : 'Failed to start logcat stream'
      toast.error(message)
    }
  }, [reset])

  const handleStop = useCallback(async () => {
    const serial = streamingSerialRef.current
    try {
      await stopLogcat(serial)
      toast.info('Logcat stream stopped')
    } catch (stopError) {
      const message = stopError instanceof Error
        ? stopError.message
        : 'Failed to stop logcat stream'
      toast.error(message)
    }
  }, [])

  const handleClear = useCallback(() => {
    clearLogs()
    toast.info('Logcat cleared')
  }, [clearLogs])

  const exportAsText = useCallback(async () => {
    const logs = useLogcatStore.getState().logs
    const serial = streamingSerialRef.current

    if (logs.length === 0) {
      toast.error('No logs to export')
      return
    }

    const content = logs.map((entry) => entry.raw).join('\n')
    const filename = `logcat-${serial || 'export'}-${Date.now()}.txt`
    try {
      await saveLogcatToFile(content, filename)
      toast.success(`Exported ${logs.length} log entries`)
    } catch {
      toast.error('Export cancelled or failed')
    }
  }, [])

  const exportAsJson = useCallback(async () => {
    const logs = useLogcatStore.getState().logs
    const serial = streamingSerialRef.current

    if (logs.length === 0) {
      toast.error('No logs to export')
      return
    }

    const content = JSON.stringify(logs, null, 2)
    const filename = `logcat-${serial || 'export'}-${Date.now()}.json`
    try {
      await saveLogcatToFile(content, filename)
      toast.success(`Exported ${logs.length} log entries`)
    } catch {
      toast.error('Export cancelled or failed')
    }
  }, [])

  useEffect(() => {
    const unsubscribeLine = onLogcatLine((entry: LogcatEntry) => {
      applyLineEvent(entry)
    })

    const unsubscribeStatus = onLogcatStatus((event) => {
      applyStatusEvent(event)
    })

    return () => {
      unsubscribeLine()
      unsubscribeStatus()
    }
  }, [applyLineEvent, applyStatusEvent])

  useEffect(() => {
    return () => {
      const serial = streamingSerialRef.current
      const streaming = isStreamingRef.current
      if (streaming && serial) {
        stopLogcat(serial).catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    function handleScroll() {
      const el = scrollContainerRef.current
      if (!el) return
      const { scrollTop, scrollHeight, clientHeight } = el
      const atBottom = scrollHeight - scrollTop - clientHeight < 50
      setShowScrollButton(!atBottom)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const actions = {
      handleClear,
      exportAsText,
      exportAsJson,
      handleStart,
      handleStop,
    }

    function handleKeyDown(event: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const mod = isMac ? event.metaKey : event.ctrlKey

      if (mod && event.key === 'k') {
        event.preventDefault()
        actions.handleClear()
      }

      if (mod && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        actions.exportAsJson()
      }

      if (mod && event.key === 'e') {
        event.preventDefault()
        actions.exportAsText()
      }

      if (mod && event.key === 's') {
        event.preventDefault()
        if (isStreamingRef.current) {
          actions.handleStop()
        } else {
          actions.handleStart()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClear, exportAsText, exportAsJson, handleStart, handleStop])

  return {
    streamingSerial,
    isStreaming,
    activeSerial,
    showScrollButton,
    scrollContainerRef,
    handleStart,
    handleStop,
    handleClear,
    exportAsText,
    exportAsJson,
    scrollToBottom: useCallback(() => {
      const el = scrollContainerRef.current
      if (!el) return
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      })
    }, []),
  }
}
