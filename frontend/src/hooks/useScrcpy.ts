import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { ScrcpyOptions, ScrcpySessionEvent } from '@/lib/types'
import { useScrcpyStore } from '@/stores/scrcpyStore'
import { useDeviceStore } from '@/stores/useDeviceStore'
import { getAppConfig } from '@/services/settingsService'
import {
  getActiveScrcpySession,
  getScrcpyEncoderSupport,
  onScrcpyError,
  onScrcpySessionStarted,
  onScrcpySessionStopped,
  selectScrcpySaveFile,
  startScrcpyRecording,
  startScrcpySession,
  stopScrcpyRecording,
  stopScrcpySession,
  takeScrcpyScreenshot,
  getScrcpyClipboard,
  pushScrcpyClipboard,
  updateScrcpyOptions,
} from '@/services/scrcpyService'

function timestampedFilename(prefix: string, extension: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .replace('Z', '')
  return `${prefix}-${stamp}.${extension}`
}

function describeError(err: unknown): { title: string; description: string } {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
  if (msg.includes('scrcpy') || msg.includes('binary')) {
    return {
      title: 'Scrcpy binary missing',
      description:
        'Scrcpy executable not found. Install scrcpy or configure the path in Settings.',
    }
  }
  if (msg.includes('device') || msg.includes('adb')) {
    return { title: 'Device connection error', description: err instanceof Error ? err.message : String(err) }
  }
  if (msg.includes('unauthorized') || msg.includes('permission')) {
    return {
      title: 'Permission denied',
      description: 'Device authorization required. Approve USB debugging on the device.',
    }
  }
  return {
    title: 'Operation failed',
    description: err instanceof Error ? err.message : String(err),
  }
}

export function useScrcpy() {
  const session = useScrcpyStore((state) => state.session)
  const isStarting = useScrcpyStore((state) => state.isStarting)
  const isStopping = useScrcpyStore((state) => state.isStopping)
  const isRecording = useScrcpyStore((state) => state.isRecording)
  const error = useScrcpyStore((state) => state.error)
  const encoderSupport = useScrcpyStore((state) => state.encoderSupport)
  const options = useScrcpyStore((state) => state.options)
  const presets = useScrcpyStore((state) => state.presets)
  const lastEventAt = useScrcpyStore((state) => state.lastEventAt)

  const setSession = useScrcpyStore((state) => state.setSession)
  const setIsStarting = useScrcpyStore((state) => state.setIsStarting)
  const setIsStopping = useScrcpyStore((state) => state.setIsStopping)
  const setIsRecording = useScrcpyStore((state) => state.setIsRecording)
  const setRecordingStartedAt = useScrcpyStore((state) => state.setRecordingStartedAt)
  const setEncoderSupport = useScrcpyStore((state) => state.setEncoderSupport)
  const setIsFetchingEncoder = useScrcpyStore((state) => state.setIsFetchingEncoder)
  const setError = useScrcpyStore((state) => state.setError)
  const setOptions = useScrcpyStore((state) => state.setOptions)
  const reset = useScrcpyStore((state) => state.reset)
  const applyStartedEvent = useScrcpyStore((state) => state.applyStartedEvent)
  const applyStoppedEvent = useScrcpyStore((state) => state.applyStoppedEvent)
  const applyErrorEvent = useScrcpyStore((state) => state.applyErrorEvent)
  const addPreset = useScrcpyStore((state) => state.addPreset)
  const removePreset = useScrcpyStore((state) => state.removePreset)

  const activeSerial = useDeviceStore((state) => state.activeSerial)

  const activeSerialRef = useRef(activeSerial)
  const sessionRef = useRef(session)
  const optionsHydratedRef = useRef(false)
  const optionsDirtyRef = useRef(false)
  const pendingOptionsRef = useRef<ScrcpyOptions | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    activeSerialRef.current = activeSerial
  }, [activeSerial])

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const saveOptions = useCallback(async (nextOptions: ScrcpyOptions) => {
    try {
      await updateScrcpyOptions(nextOptions)
    } catch (err) {
      console.error('failed to save scrcpy options', err)
      toast.error('Failed to save Scrcpy settings', {
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }, [])

  const scheduleOptionsSave = useCallback(
    (nextOptions: ScrcpyOptions) => {
      pendingOptionsRef.current = nextOptions
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = window.setTimeout(() => {
        const pending = pendingOptionsRef.current
        pendingOptionsRef.current = null
        saveTimerRef.current = null
        if (pending) void saveOptions(pending)
      }, 250)
    },
    [saveOptions],
  )

  useEffect(() => {
    let cancelled = false
    optionsHydratedRef.current = false
    optionsDirtyRef.current = false

    getAppConfig()
      .then((config) => {
        if (cancelled) return
        if (!optionsDirtyRef.current && config.scrcpy_options) {
          setOptions(config.scrcpy_options)
        }
        optionsHydratedRef.current = true
        if (optionsDirtyRef.current) {
          scheduleOptionsSave(useScrcpyStore.getState().options)
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error('failed to load scrcpy options', err)
        optionsHydratedRef.current = true
      })

    return () => {
      cancelled = true
    }
  }, [scheduleOptionsSave, setOptions])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
      const pending = pendingOptionsRef.current
      pendingOptionsRef.current = null
      if (pending && optionsHydratedRef.current) {
        void saveOptions(pending)
      }
    }
  }, [saveOptions])

  const updateOptions = useCallback(
    (nextOptions: ScrcpyOptions) => {
      optionsDirtyRef.current = true
      setOptions(nextOptions)
      if (optionsHydratedRef.current) {
        scheduleOptionsSave(nextOptions)
      }
    },
    [scheduleOptionsSave, setOptions],
  )

  const resetScrcpy = useCallback(() => {
    reset()
    optionsDirtyRef.current = true
    const nextOptions = useScrcpyStore.getState().options
    if (optionsHydratedRef.current) {
      scheduleOptionsSave(nextOptions)
    }
  }, [reset, scheduleOptionsSave])

  useEffect(() => {
    if (!activeSerial) {
      setEncoderSupport(null)
      return
    }
    let cancelled = false
    setIsFetchingEncoder(true)
    getScrcpyEncoderSupport(activeSerial)
      .then((support) => {
        if (cancelled) return
        setEncoderSupport(support)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('failed to load encoder support', err)
        setEncoderSupport(null)
      })
      .finally(() => {
        if (!cancelled) setIsFetchingEncoder(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeSerial, setEncoderSupport, setIsFetchingEncoder])

  useEffect(() => {
    getActiveScrcpySession()
      .then((active) => {
        if (active) {
          setSession(active)
        }
      })
      .catch((err) => {
        console.error('failed to read active scrcpy session', err)
      })
  }, [setSession])

  useEffect(() => {
    const unsubStarted = onScrcpySessionStarted((event: ScrcpySessionEvent) => {
      applyStartedEvent(event)
      toast.success('Session started', {
        description: `Mirroring device ${event.serial}`,
      })
    })
    const unsubStopped = onScrcpySessionStopped((event: ScrcpySessionEvent) => {
      applyStoppedEvent(event)
      toast.info('Session stopped', {
        description: event.message ?? 'Scrcpy session ended',
      })
    })
    const unsubError = onScrcpyError((event: ScrcpySessionEvent) => {
      applyErrorEvent(event)
      const { title, description } = describeError(new Error(event.message ?? 'unknown'))
      toast.error(title, { description })
    })
    return () => {
      unsubStarted()
      unsubStopped()
      unsubError()
    }
  }, [applyStartedEvent, applyStoppedEvent, applyErrorEvent])

  const handleStart = useCallback(
    async (nextOptions: ScrcpyOptions) => {
      const serial = activeSerialRef.current
      if (!serial) {
        toast.error('No device selected', {
          description: 'Connect a device before starting a session.',
        })
        return
      }
      setIsStarting(true)
      setError(null)
      try {
        const next = await startScrcpySession(serial, nextOptions)
        setSession(next)
      } catch (err) {
        const { title, description } = describeError(err)
        toast.error(title, { description })
        setIsStarting(false)
      }
    },
    [setIsStarting, setError, setSession],
  )

  const handleStop = useCallback(async () => {
    const current = sessionRef.current
    if (!current) return
    setIsStopping(true)
    try {
      await stopScrcpySession(current.id)
    } catch (err) {
      const { title, description } = describeError(err)
      toast.error(title, { description })
      setIsStopping(false)
    }
  }, [setIsStopping])

  const handleScreenshot = useCallback(async () => {
    const current = sessionRef.current
    if (!current) {
      toast.error('No active session', {
        description: 'Start a scrcpy session first to capture screenshots.',
      })
      return
    }
    try {
      const outputPath = await selectScrcpySaveFile(
        timestampedFilename('scrcpy-screenshot', 'png'),
      )
      if (!outputPath) return
      const savedPath = await takeScrcpyScreenshot(current.id, outputPath)
      toast.success('Screenshot saved', { description: savedPath })
    } catch (err) {
      const { title, description } = describeError(err)
      toast.error(title, { description })
    }
  }, [])

  const handleToggleRecord = useCallback(async () => {
    const serial = activeSerialRef.current
    if (!serial) {
      toast.error('No device selected', {
        description: 'Connect a device first to record.',
      })
      return
    }
    if (isRecording) {
      try {
        const savedPath = await stopScrcpyRecording()
        setIsRecording(false)
        setRecordingStartedAt(null)
        toast.success('Recording saved', { description: savedPath })
      } catch (err) {
        const { title, description } = describeError(err)
        toast.error(title, { description })
      }
      return
    }
    try {
      const outputPath = await selectScrcpySaveFile(
        timestampedFilename('scrcpy-recording', 'mp4'),
      )
      if (!outputPath) return
      await startScrcpyRecording(serial, outputPath, options)
      setIsRecording(true)
      setRecordingStartedAt(Date.now())
      toast.info('Recording started', { description: 'Screen recording in progress' })
    } catch (err) {
      const { title, description } = describeError(err)
      toast.error(title, { description })
    }
  }, [isRecording, options, setIsRecording, setRecordingStartedAt])

  const handleSavePreset = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      addPreset({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
        options,
        createdAt: Date.now(),
      })
    },
    [addPreset, options],
  )

  const handleDeletePreset = useCallback(
    (id: string) => {
      removePreset(id)
    },
    [removePreset],
  )

  const handlePushClipboard = useCallback(async (text: string) => {
    const serial = activeSerialRef.current
    if (!serial) {
      toast.error('No device selected', {
        description: 'Connect a device before syncing clipboard.',
      })
      return
    }
    try {
      await pushScrcpyClipboard(serial, text)
      toast.success('Clipboard pushed to device')
    } catch (err) {
      const { title, description } = describeError(err)
      toast.error(title, { description })
    }
  }, [])

  const handlePullClipboard = useCallback(async () => {
    const serial = activeSerialRef.current
    if (!serial) {
      toast.error('No device selected', {
        description: 'Connect a device before pulling clipboard.',
      })
      return
    }
    try {
      const text = await getScrcpyClipboard(serial)
      if (text) {
        await navigator.clipboard.writeText(text)
        toast.success('Clipboard pulled', { description: text.slice(0, 80) })
      } else {
        toast.info('Device clipboard is empty')
      }
    } catch (err) {
      const { title, description } = describeError(err)
      toast.error(title, { description })
    }
  }, [])

  return {
    session,
    encoderSupport,
    isStarting,
    isStopping,
    isRecording,
    error,
    options,
    presets,
    lastEventAt,
    activeSerial,
    isConnected: session?.status === 'running',
    handleStart,
    handleStop,
    handleScreenshot,
    handleToggleRecord,
    handleSavePreset,
    handleDeletePreset,
    handlePushClipboard,
    handlePullClipboard,
    updateOptions,
    resetScrcpy,
  }
}
