import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  IconRefresh as RefreshCw,
  IconPlayerPlay as Play,
  IconDeviceMobile as Smartphone,
  IconAlertTriangle as AlertTriangle,
  IconLoader2 as Loader2
} from "@tabler/icons-react"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useScrcpy } from '@/hooks/useScrcpy'
import { useScrcpyStore } from '@/stores/scrcpyStore'
import { getScrcpyEncoderSupport } from '@/services/scrcpyService'
import { VideoContainer } from '@/components/scrcpy/VideoContainer'
import { ControlDock } from '@/components/scrcpy/ControlDock'
import { RecordingIndicator } from '@/components/scrcpy/RecordingIndicator'
import { ScreenshotFlash } from '@/components/scrcpy/ScreenshotFlash'
import { PresetsManager } from '@/components/scrcpy/PresetsManager'
import { SettingsPanel } from '@/components/scrcpy/SettingsPanel'
import { QualityControls } from '@/components/scrcpy/QualityControls'
import { AudioControls } from '@/components/scrcpy/AudioControls'
import { DeviceOptionsControls } from '@/components/scrcpy/DeviceOptionsControls'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

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

const containerVariants = (reduced: boolean) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: reduced
      ? { duration: 0, staggerChildren: 0 }
      : { staggerChildren: 0.05 },
  },
})

const itemVariants = (reduced: boolean) => ({
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: reduced
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
})

export default function ScrcpyPage() {
  const reduced = useReducedMotion()
  const {
    session,
    encoderSupport,
    isStarting,
    isStopping,
    isRecording,
    error,
    options,
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

  const scrcpyOptions = useScrcpyStore((state) => state.options)
  const setEncoderSupport = useScrcpyStore((state) => state.setEncoderSupport)
  const recordingStartedAt = useScrcpyStore(
    (state) => state.recordingStartedAt,
  )
  const isFetchingEncoder = useScrcpyStore(
    (state) => state.isFetchingEncoder,
  )

  const sessionStatus = session?.status ?? null
  const [configTab, setConfigTab] = useState('quality')
  const [screenshotFlash, setScreenshotFlash] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState('00:00')

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

  return (
    <motion.div
      variants={containerVariants(reduced)}
      initial="hidden"
      animate="show"
      className="flex h-full min-h-0 flex-col gap-4 overflow-hidden"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants(reduced)}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Scrcpy Hub
          </h1>
          <p className="text-xs text-muted-foreground">
            Mirror, record, capture, and sync clipboard with your Android device.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground dark:text-muted-foreground hover:bg-[var(--muted)] dark:hover:bg-[var(--muted)] rounded-full"
            onClick={resetScrcpy}
            aria-label="Reset scrcpy state"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

      {/* Main Grid: Split Layout */}
      <motion.div
        variants={itemVariants(reduced)}
        className="relative flex-1 overflow-hidden rounded-2xl border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--terminal-bg)]/20 flex flex-col lg:flex-row shadow-[var(--shadow-card)]"
      >
        {/* Left Column: Device Screen / Mirror Box */}
        <div className="relative flex-grow flex flex-col items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-[var(--border)] dark:border-[var(--border)] min-h-[300px]">
          <motion.div
            key={isStopping ? 'stopping' : isConnected ? 'connected' : 'idle'}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full flex flex-col items-center justify-center"
          >
            {isStopping ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
                  Stopping session...
                </p>
              </div>
            ) : isConnected ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <VideoContainer
                  sessionStatus={sessionStatus ?? 'running'}
                  error={error}
                  isStarting={false}
                  options={options}
                />
                <RecordingIndicator
                  className="absolute right-4 top-4 z-10"
                  isRecording={isRecording}
                  startedAt={recordingStartedAt}
                  duration={recordingDuration}
                />
                <ControlDock
                  className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
                  isConnected={isConnected}
                  isRecording={isRecording}
                  onScreenshot={handleScreenshotWithFlash}
                  onToggleRecord={handleToggleRecord}
                  onStopSession={handleStop}
                />
                <ScreenshotFlash visible={screenshotFlash} />
              </div>
            ) : (
              /* Idle Screen Phone Mockup */
              <div className="flex max-w-md flex-col items-center text-center z-10">
                <div
                  className={`mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--border)] dark:border-[var(--border)] shadow-[var(--shadow-card)] transition-colors duration-300 ${
                    isStarting
                      ? 'bg-primary/10 text-primary animate-pulse'
                      : 'bg-[var(--muted)] dark:bg-[var(--muted)]/30 text-muted-foreground'
                  }`}
                >
                  {isStarting ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                  ) : (
                    <Smartphone className="h-9 w-9 text-muted-foreground dark:text-muted-foreground" />
                  )}
                </div>

                <h2 className="text-lg font-bold tracking-tight text-foreground dark:text-foreground">
                  {isStarting ? 'Connecting...' : 'Ready to mirror'}
                </h2>

                <p className="mt-1.5 text-xs text-muted-foreground dark:text-muted-foreground font-medium">
                  {activeSerial
                    ? `Device: ${activeSerial}`
                    : 'No active device selected'}
                </p>

                {error && (
                  <div className="mt-4 flex w-full items-start gap-2 rounded-xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 dark:bg-[var(--destructive)]/20 px-3 py-2 text-left text-[11px] text-[var(--destructive)] dark:text-[var(--destructive)]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  size="lg"
                  className="mt-8 w-56 gap-2 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs h-10 shadow-sm cursor-pointer transition-[colors,transform] active:scale-[0.97]"
                  onClick={() => handleStart(scrcpyOptions)}
                  disabled={isStarting || !activeSerial}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Start session
                    </>
                  )}
                </Button>

                {!activeSerial && !isStarting && (
                  <p className="mt-3 text-[10px] text-[var(--destructive)] font-semibold animate-pulse">
                    Select a device first
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Configuration & Utilities */}
        <div className="w-full lg:w-[400px] flex flex-col bg-[var(--muted)]/50 dark:bg-[var(--terminal-bg)]/20 overflow-y-auto min-w-0">
          <motion.div
            key={isStopping ? 'stopping' : isConnected ? 'connected' : 'idle'}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-grow flex flex-col min-h-0"
          >
            {isStopping ? (
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
            ) : isConnected ? (
              /* Live Utilities Panel */
              <div className="p-5">
                <SettingsPanel
                  encoderSupport={encoderSupport}
                  isFetchingEncoder={isFetchingEncoder}
                  onRefreshEncoder={handleRefreshEncoder}
                  onPushClipboard={handlePushClipboard}
                  onPullClipboard={handlePullClipboard}
                  isConnected={isConnected}
                />
              </div>
            ) : (
              /* Disconnected Configuration Panel */
              <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-sm font-bold text-foreground mb-4 tracking-tight">Configuration</h3>
                <Tabs value={configTab} onValueChange={setConfigTab} className="w-full flex-1 flex flex-col">
                  <TabsList className="mb-4 grid w-full grid-cols-4 bg-[var(--muted)] dark:bg-[var(--muted)]/60 p-0.5 rounded-full">
                    <TabsTrigger value="quality" className="rounded-full text-[11px] font-semibold">Quality</TabsTrigger>
                    <TabsTrigger value="audio" className="rounded-full text-[11px] font-semibold">Audio</TabsTrigger>
                    <TabsTrigger value="device" className="rounded-full text-[11px] font-semibold">Device</TabsTrigger>
                    <TabsTrigger value="presets" className="rounded-full text-[11px] font-semibold">Presets</TabsTrigger>
                  </TabsList>

                  <TabsContent value="quality" className="mt-0 outline-none flex-grow">
                    <Card className="border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/40 p-4 rounded-2xl shadow-[var(--shadow-card)]">
                      <QualityControls
                        options={scrcpyOptions}
                        onOptionChange={(key, val) => updateOptions({ ...scrcpyOptions, [key]: val })}
                      />
                    </Card>
                  </TabsContent>

                  <TabsContent value="audio" className="mt-0 outline-none flex-grow">
                    <Card className="border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/40 p-4 rounded-2xl shadow-[var(--shadow-card)]">
                      <AudioControls
                        options={scrcpyOptions}
                        onOptionChange={(key, val) => updateOptions({ ...scrcpyOptions, [key]: val })}
                      />
                    </Card>
                  </TabsContent>

                  <TabsContent value="device" className="mt-0 outline-none flex-grow">
                    <Card className="border border-[var(--border)] dark:border-[var(--border)] bg-card dark:bg-[var(--muted)]/40 p-4 rounded-2xl shadow-[var(--shadow-card)]">
                      <DeviceOptionsControls
                        options={scrcpyOptions}
                        onOptionChange={(key, val) => updateOptions({ ...scrcpyOptions, [key]: val })}
                      />
                    </Card>
                  </TabsContent>

                  <TabsContent value="presets" className="mt-0 outline-none flex-grow">
                    <PresetsManager
                      currentOptions={scrcpyOptions}
                      presets={presets}
                      onApplyPreset={updateOptions}
                      onSavePreset={handleSavePreset}
                      onDeletePreset={handleDeletePreset}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
