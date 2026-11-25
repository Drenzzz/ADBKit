import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  IconRefresh as RefreshCw,
  IconPlayerPlay as Play,
  IconPlayerStop as Stop,
  IconCamera as Camera,
  IconCircle as Circle,
  IconSquare as Square,
  IconAlertTriangle as AlertTriangle,
  IconLoader2 as Loader2
} from "@tabler/icons-react"
import { Heading } from '@astryxdesign/core/Heading'
import { useScrcpy } from '@/hooks/useScrcpy'
import { useDevices } from '@/hooks/useDevices'
import { NoDeviceState } from '@/components/apps/EmptyStates'
import { useScrcpyStore } from '@/stores/scrcpyStore'
import { getScrcpyEncoderSupport, getAndroidVersion, getScrcpyDisplayList } from '@/services/scrcpyService'
import { RecordingIndicator } from '@/components/scrcpy/RecordingIndicator'
import { ScreenshotFlash } from '@/components/scrcpy/ScreenshotFlash'
import { PresetsManager } from '@/components/scrcpy/PresetsManager'
import { QualityControls } from '@/components/scrcpy/QualityControls'
import { AudioControls } from '@/components/scrcpy/AudioControls'
import { DeviceOptionsControls } from '@/components/scrcpy/DeviceOptionsControls'
import { ClipboardPanel, EncodersPanel } from '@/components/scrcpy/SettingsPanel'
import { cn } from '@/lib/utils'
import {
  IconVideo,
  IconVolume,
  IconDeviceMobile,
  IconBookmark,
} from "@tabler/icons-react"
import type { ReactNode } from 'react'

function formatElapsed(startedAt: number): string {
  const total = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mm = minutes.toString().padStart(2, '0')
  const ss = seconds.toString().padStart(2, '0')
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={cn('text-[24px] font-semibold tabular-nums text-[var(--color-text-primary)]', mono && 'font-mono')}>
        {value}
      </p>
      <p className="text-[14px] text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="m3-surface rounded-3xl p-5">
      <h3 className="mb-4 flex items-center gap-2.5 text-[18px] font-semibold text-[var(--color-text-primary)]">
        <span className="text-[var(--color-text-secondary)]">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  )
}

export default function ScrcpyPage() {
  const reduced = useReducedMotion()
  const {
    session,
    encoderSupport,
    isStarting,
    isStopping,
    isRecording,
    error,
    presets,
    activeSerial,
    isConnected,
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
  } = useScrcpy()

  const { refreshing, refreshDevices } = useDevices()

  const scrcpyOptions = useScrcpyStore((state) => state.options)
  const setEncoderSupport = useScrcpyStore((state) => state.setEncoderSupport)
  const recordingStartedAt = useScrcpyStore(
    (state) => state.recordingStartedAt,
  )
  const isFetchingEncoder = useScrcpyStore(
    (state) => state.isFetchingEncoder,
  )

  const [screenshotFlash, setScreenshotFlash] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState('00:00')
  const [sessionElapsed, setSessionElapsed] = useState('00:00')
  const [androidSdk, setAndroidSdk] = useState<number | null>(null)
  const [displays, setDisplays] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    if (!activeSerial) return
    let cancelled = false
    getAndroidVersion(activeSerial)
      .then((sdk) => { if (!cancelled) setAndroidSdk(sdk) })
      .catch(() => { if (!cancelled) setAndroidSdk(null) })
    getScrcpyDisplayList(activeSerial)
      .then((list) => { if (!cancelled) setDisplays(list.displays) })
      .catch(() => { if (!cancelled) setDisplays([]) })
    return () => { cancelled = true }
  }, [activeSerial])

  useEffect(() => {
    if (!isRecording || !recordingStartedAt) {
      setRecordingDuration('00:00')
      return
    }
    const tick = () => setRecordingDuration(formatElapsed(recordingStartedAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isRecording, recordingStartedAt])

  useEffect(() => {
    if (!isConnected || !session?.startedAt) {
      setSessionElapsed('00:00')
      return
    }
    const startedAt = session.startedAt
    const tick = () => setSessionElapsed(formatElapsed(startedAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isConnected, session?.startedAt])

  const handleRefreshEncoder = async () => {
    if (!activeSerial) return
    setEncoderSupport(null)
    try {
      const next = await getScrcpyEncoderSupport(activeSerial)
      setEncoderSupport(next)
    } catch (err) {
      console.error('encoder refresh failed', err)
    }
  }

  const handleScreenshotWithFlash = async () => {
    setScreenshotFlash(true)
    window.setTimeout(() => setScreenshotFlash(false), 250)
    await handleScreenshot()
  }

  const stateLabel = isStopping
    ? 'stopping'
    : isStarting
      ? 'starting'
      : isConnected
        ? 'running'
        : 'idle'
  const stateOk = isConnected
  const stateBusy = isStarting || isStopping

  const enter = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.12 : 0.35, delay: reduced ? 0 : delay, ease: EASE },
  })

  if (!activeSerial) {
    return (
      <div className="dashboard-scale flex h-full min-h-0 flex-col gap-4 p-5">
        <Heading level={1} type="display-1" weight="semibold" maxLines={1}>Scrcpy</Heading>
        <div className="min-h-0 flex-1">
          <NoDeviceState
            onRefresh={refreshDevices}
            refreshing={refreshing}
            description="Connect an Android device to start a mirror session"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-scale relative flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-5">
      <motion.header {...enter(0)} className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1} type="display-1" weight="semibold" maxLines={1}>Scrcpy</Heading>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'h-2.5 w-2.5 shrink-0 rounded-full',
              stateOk
                ? 'bg-[var(--color-success)] '
                : stateBusy
                  ? 'bg-[var(--color-warning)] '
                  : 'bg-[var(--color-text-secondary)]/40',
            )}
          />
          <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            {activeSerial || 'No device'}
          </span>
          <span className="text-[14px] font-semibold text-[var(--color-text-secondary)]">{stateLabel}</span>
          <button
            type="button"
            aria-label="Reset scrcpy state"
            onClick={resetScrcpy}
            className="flex size-11 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-card)]/60 hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          >
            <RefreshCw size={18} stroke={1.75} />
          </button>
        </div>
      </motion.header>

      <motion.section
        {...enter(0.05)}
        className="m3-surface flex flex-wrap items-center gap-x-6 gap-y-4 rounded-3xl px-5 py-4"
      >
        <div className="flex items-center gap-3">
          {isConnected ? (
            <button
              type="button"
              onClick={handleStop}
              disabled={isStopping}
              className="flex h-[52px] items-center gap-2 rounded-full bg-[var(--color-error)] px-7 text-[16px] font-bold text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)] disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {isStopping ? (
                <Loader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Stop size={18} stroke={1.75} />
              )}
              {isStopping ? 'Stopping…' : 'Stop session'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStart(scrcpyOptions)}
              disabled={isStarting || !activeSerial}
              className="flex h-[52px] items-center gap-2 rounded-full bg-[var(--color-accent)] px-7 text-[16px] font-bold text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {isStarting ? (
                <Loader2 size={18} stroke={1.75} className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Play size={18} stroke={1.75} />
              )}
              {isStarting ? 'Starting…' : 'Start session'}
            </button>
          )}
          <RecordingIndicator
            isRecording={isRecording}
            startedAt={recordingStartedAt}
            duration={recordingDuration}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-3 max-lg:basis-full">
          <Stat label="Codec" value={scrcpyOptions.video_codec || 'h264'} mono />
          <Stat
            label="Max resolution"
            value={scrcpyOptions.max_size === 0 ? 'Unlimited' : `${scrcpyOptions.max_size}px`}
          />
          <Stat
            label="Bitrate"
            value={
              scrcpyOptions.bit_rate === 0
                ? 'Default'
                : `${(scrcpyOptions.bit_rate / 1_000_000).toFixed(1)} Mbps`
            }
          />
          <Stat
            label="Max FPS"
            value={scrcpyOptions.max_fps === 0 ? 'Unlimited' : String(scrcpyOptions.max_fps)}
          />
          {isConnected && session && <Stat label="Running" value={sessionElapsed} mono />}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleScreenshotWithFlash}
            disabled={!isConnected}
            className="flex h-11 items-center gap-2 rounded-full border border-border/50 px-5 text-[15px] font-semibold text-[var(--color-text-primary)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--color-background-card)]/60 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <Camera size={18} stroke={1.75} className="text-[var(--color-text-secondary)]" />
            Screenshot
          </button>
          <button
            type="button"
            onClick={handleToggleRecord}
            disabled={!isConnected}
            className={cn(
              'flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100',
              isRecording
                ? 'bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)] text-[var(--color-error)] focus-visible:outline-[var(--color-error)]'
                : 'border border-border/50 text-[var(--color-text-primary)] hover:bg-[var(--color-background-card)]/60 focus-visible:outline-[var(--color-accent)]',
            )}
          >
            {isRecording ? (
              <Square size={16} stroke={1.75} className="fill-current" />
            ) : (
              <Circle size={16} stroke={1.75} className="fill-current text-[var(--color-error)]" />
            )}
            {isRecording ? 'Stop recording' : 'Record'}
          </button>
        </div>
      </motion.section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-5 py-3.5 text-[14px] font-medium text-[var(--color-error)]">
          <AlertTriangle size={18} stroke={1.75} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {isConnected && (
        <p className="rounded-2xl bg-[var(--color-surface-inset)] px-5 py-3.5 text-[14px] text-[var(--color-text-secondary)]">
          Session running: changes apply to the next session
        </p>
      )}

      <motion.div
        {...enter(0.1)}
        className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <fieldset disabled={isConnected} className="flex min-w-0 flex-col gap-4 disabled:opacity-60">
          <Section icon={<IconVideo size={20} stroke={1.75} />} title="Video">
            <QualityControls
              options={scrcpyOptions}
              onOptionChange={(key, val) => updateOptions({ ...scrcpyOptions, [key]: val })}
            />
          </Section>
          <Section icon={<IconVolume size={20} stroke={1.75} />} title="Audio">
            <AudioControls
              options={scrcpyOptions}
              onOptionChange={(key, val) => updateOptions({ ...scrcpyOptions, [key]: val })}
            />
          </Section>
          <Section icon={<IconDeviceMobile size={20} stroke={1.75} />} title="Device behavior">
            <DeviceOptionsControls
              options={scrcpyOptions}
              onOptionChange={(key, val) => updateOptions({ ...scrcpyOptions, [key]: val })}
              displays={displays}
              androidSdk={androidSdk}
            />
          </Section>
        </fieldset>

        <div className="flex min-w-0 flex-col gap-4">
          <ClipboardPanel
            onPushClipboard={handlePushClipboard}
            onPullClipboard={handlePullClipboard}
            isConnected={isConnected}
          />
          <EncodersPanel
            encoderSupport={encoderSupport}
            isFetchingEncoder={isFetchingEncoder}
            onRefreshEncoder={handleRefreshEncoder}
            isConnected={isConnected}
          />
          <fieldset disabled={isConnected} className="min-w-0 disabled:opacity-60">
            <Section icon={<IconBookmark size={20} stroke={1.75} />} title="Presets">
              <PresetsManager
                currentOptions={scrcpyOptions}
                presets={presets}
                onApplyPreset={updateOptions}
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
              />
            </Section>
          </fieldset>
        </div>
      </motion.div>

      <ScreenshotFlash visible={screenshotFlash} />
    </div>
  )
}