import { useEffect, useCallback } from 'react'
import { getPerformanceSnapshot } from '@/services/deviceService'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { useMetricsHistoryStore } from '@/stores/metricsHistoryStore'

const MONITOR_POLL_INTERVAL = 5000

export function useMonitor(serial: string, isActive: boolean) {
  const { performance, perfLoading, setPerformance, setPerfLoading, setError } = useDeviceStore()
  const { pushCPU, pushRAM, pushRX } = useMetricsHistoryStore()

  const refresh = useCallback(async () => {
    if (!serial || !isActive) {
      setPerformance(null)
      return
    }
    setPerfLoading(true)
    setError(null)
    try {
      const snap = await getPerformanceSnapshot(serial)
      setPerformance(snap)
      pushCPU(snap.cpuUsage)
      pushRAM(snap.ramUsage)
      pushRX(snap.networkRxSec)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch performance data')
      setPerformance(null)
    } finally {
      setPerfLoading(false)
    }
  }, [serial, isActive, setPerformance, setPerfLoading, setError, pushCPU, pushRAM, pushRX])

  useEffect(() => {
    if (!serial || !isActive) {
      setPerformance(null)
      return
    }

    refresh()

    const intervalId = window.setInterval(() => {
      if (document.hidden) return
      refresh()
    }, MONITOR_POLL_INTERVAL)

    function handleVisibilityChange() {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [serial, isActive, refresh, setPerformance])

  return {
    snapshot: performance,
    polling: perfLoading,
    error: null as string | null,
    refresh,
  }
}
