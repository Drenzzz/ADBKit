import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScrcpy } from '@/hooks/useScrcpy'
import { useScrcpyStore } from '@/stores/scrcpyStore'
import { ScrcpyIdleDashboard } from '@/components/scrcpy/ScrcpyIdleDashboard'
import { VideoContainer } from '@/components/scrcpy/VideoContainer'
import { ControlDock } from '@/components/scrcpy/ControlDock'
import { RecordingIndicator } from '@/components/scrcpy/RecordingIndicator'
import { ScreenshotFlash } from '@/components/scrcpy/ScreenshotFlash'
import { PresetsManager } from '@/components/scrcpy/PresetsManager'
import { SettingsPanel } from '@/components/scrcpy/SettingsPanel'
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

export default function ScrcpyPage() {
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
  } = useScrcpy()

  const scrcpyOptions = useScrcpyStore((state) => state.options)
  const setScrcpyOptions = useScrcpyStore((state) => state.setOptions)
  const setEncoderSupport = useScrcpyStore((state) => state.setEncoderSupport)
  const recordingStartedAt = useScrcpyStore(
    (state) => state.recordingStartedAt,
  )
  const isFetchingEncoder = useScrcpyStore(
    (state) => state.isFetchingEncoder,
  )

  const sessionStatus = session?.status ?? null
  const [configTab, setConfigTab] = useState('config')
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
      const { getScrcpyEncoderSupport } = await import(
        '@/services/scrcpyService'
      )
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
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Scrcpy Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Mirror, record, capture, and sync clipboard with your Android
            device.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => useScrcpyStore.getState().reset()}
            aria-label="Reset scrcpy state"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-lg border border-border/40 bg-background/30">
        {isConnected ? (
          <div className="relative flex h-full w-full flex-col">
            <div className="relative flex-1">
              <VideoContainer
                sessionStatus={sessionStatus ?? 'running'}
                error={error}
                isStarting={false}
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
            <div className="border-t border-border/40 p-4">
              <Tabs value={configTab} onValueChange={setConfigTab}>
                <TabsList>
                  <TabsTrigger value="config">Options</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="config" className="mt-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-border/40 p-3 text-xs">
                      <p className="font-semibold">Video</p>
                      <p className="text-muted-foreground">
                        {options.max_size === 0
                          ? 'Unlimited resolution'
                          : `${options.max_size}px`}{' '}
                        · {(options.bit_rate / 1_000_000).toFixed(1)} Mbps
                      </p>
                    </div>
                    <div className="rounded-md border border-border/40 p-3 text-xs">
                      <p className="font-semibold">Frame rate</p>
                      <p className="text-muted-foreground">
                        {options.max_fps === 0
                          ? 'Unlimited'
                          : `${options.max_fps} fps`}
                      </p>
                    </div>
                    <div className="rounded-md border border-border/40 p-3 text-xs">
                      <p className="font-semibold">Audio</p>
                      <p className="text-muted-foreground">
                        {options.no_audio
                          ? 'Disabled'
                          : `${options.audio_codec} · ${(
                              options.audio_bit_rate / 1000
                            ).toFixed(0)} kbps`}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="presets" className="mt-3">
                  <PresetsManager
                    currentOptions={options}
                    presets={presets}
                    onApplyPreset={setScrcpyOptions}
                    onSavePreset={handleSavePreset}
                    onDeletePreset={handleDeletePreset}
                  />
                </TabsContent>
                <TabsContent value="settings" className="mt-3">
                  <SettingsPanel
                    encoderSupport={encoderSupport}
                    isFetchingEncoder={isFetchingEncoder}
                    onRefreshEncoder={handleRefreshEncoder}
                    onPushClipboard={handlePushClipboard}
                    onPullClipboard={handlePullClipboard}
                    isConnected={isConnected}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="flex-1 overflow-auto">
              {isStopping ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <p className="text-sm text-muted-foreground">
                      Stopping session…
                    </p>
                  </div>
                </div>
              ) : (
                <ScrcpyIdleDashboard
                  options={scrcpyOptions}
                  encoderSupport={encoderSupport}
                  isFetchingEncoder={isFetchingEncoder}
                  onOptionsChange={setScrcpyOptions}
                  onRefreshEncoder={handleRefreshEncoder}
                  onStart={() => handleStart(scrcpyOptions)}
                  isStarting={isStarting || sessionStatus === 'starting'}
                  activeSerial={activeSerial ?? undefined}
                  error={error}
                />
              )}
            </div>
            {!isConnected && !isStopping && (
              <div className="border-t border-border/40 p-4">
                <Tabs value={configTab} onValueChange={setConfigTab}>
                  <TabsList>
                    <TabsTrigger value="config">Config</TabsTrigger>
                    <TabsTrigger value="presets">Presets</TabsTrigger>
                  </TabsList>
                  <TabsContent value="config" className="mt-3">
                    <p className="text-xs text-muted-foreground">
                      Adjust quality, audio, and device options in the
                      side panel above, then press Start session.
                    </p>
                  </TabsContent>
                  <TabsContent value="presets" className="mt-3">
                    <PresetsManager
                      currentOptions={scrcpyOptions}
                      presets={presets}
                      onApplyPreset={setScrcpyOptions}
                      onSavePreset={handleSavePreset}
                      onDeletePreset={handleDeletePreset}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
