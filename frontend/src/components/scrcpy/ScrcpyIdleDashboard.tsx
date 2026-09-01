import { useState } from 'react'
import {
  IconPlayerPlay as Play,
  IconDeviceMobile as Smartphone,
  IconAlertTriangle as AlertTriangle
} from "@tabler/icons-react"
import type {
  ScrcpyEncoderSupport,
  ScrcpyOptions,
} from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { QualityControls } from '@/components/scrcpy/QualityControls'
import { AudioControls } from '@/components/scrcpy/AudioControls'
import { DeviceOptionsControls } from '@/components/scrcpy/DeviceOptionsControls'
import { EncoderBadge, EncoderLegend } from '@/components/scrcpy/EncoderBadge'

interface ScrcpyIdleDashboardProps {
  options: ScrcpyOptions
  encoderSupport: ScrcpyEncoderSupport | null
  isFetchingEncoder: boolean
  onOptionsChange: (options: ScrcpyOptions) => void
  onRefreshEncoder: () => void
  onStart: () => void
  isStarting: boolean
  activeSerial?: string
  error?: string | null
}

export function ScrcpyIdleDashboard({
  options,
  encoderSupport,
  isFetchingEncoder,
  onOptionsChange,
  onRefreshEncoder,
  onStart,
  isStarting,
  activeSerial,
  error,
}: ScrcpyIdleDashboardProps) {
  const [activeTab, setActiveTab] = useState('quality')

  const handleOptionChange = (
    key: string,
    value: number | string | boolean,
  ) => {
    onOptionsChange({ ...options, [key]: value })
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative flex flex-1 flex-col items-center justify-center border-r border-border/40 p-8">
        <div className="z-10 flex max-w-md flex-col items-center text-center">
          <div
            className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/40 ${
              isStarting
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isStarting ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            ) : (
              <Smartphone className="h-10 w-10" />
            )}
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {isStarting ? 'Connecting…' : 'Ready to mirror'}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {activeSerial
              ? `Device: ${activeSerial}`
              : 'No active device selected'}
          </p>

          {error && (
            <div className="mt-4 flex w-full items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-left text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            size="lg"
            className="mt-8 w-60 gap-2 rounded-full"
            onClick={onStart}
            disabled={isStarting || !activeSerial}
          >
            {isStarting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Starting…
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" />
                Start session
              </>
            )}
          </Button>

          {!activeSerial && !isStarting && (
            <p className="mt-3 text-xs text-destructive">
              Select a device first
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full max-w-[440px] flex-col overflow-y-auto bg-muted/20">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Configuration</h3>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-4">
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="device">Device</TabsTrigger>
              <TabsTrigger value="encoders">Encoders</TabsTrigger>
            </TabsList>

            <TabsContent value="quality" className="space-y-4">
              <Card className="border-border/50 bg-background/50 p-5">
                <QualityControls
                  options={options}
                  onOptionChange={handleOptionChange}
                />
              </Card>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              <Card className="border-border/50 bg-background/50 p-5">
                <AudioControls
                  options={options}
                  onOptionChange={handleOptionChange}
                />
              </Card>
            </TabsContent>

            <TabsContent value="device" className="space-y-4">
              <Card className="border-border/50 bg-background/50 p-5">
                <DeviceOptionsControls
                  options={options}
                  onOptionChange={handleOptionChange}
                />
              </Card>
            </TabsContent>

            <TabsContent value="encoders" className="space-y-4">
              <Card className="border-border/50 bg-background/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Available encoders</h4>
                    <p className="text-xs text-muted-foreground">
                      Reported by scrcpy --list-encoders.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onRefreshEncoder}
                    disabled={isFetchingEncoder || !activeSerial}
                  >
                    Refresh
                  </Button>
                </div>
                {isFetchingEncoder && !encoderSupport && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                )}
                {encoderSupport && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Video
                      </Label>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {encoderSupport.videoCodecs.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No video encoders reported
                          </span>
                        ) : (
                          encoderSupport.videoCodecs.map((codec) => (
                            <EncoderBadge
                              key={`v-idle-${codec.codec}-${codec.encoderName}`}
                              codec={codec}
                            />
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Audio
                      </Label>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {encoderSupport.audioCodecs.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No audio encoders reported
                          </span>
                        ) : (
                          encoderSupport.audioCodecs.map((codec) => (
                            <EncoderBadge
                              key={`a-idle-${codec.codec}-${codec.encoderName}`}
                              codec={codec}
                            />
                          ))
                        )}
                      </div>
                    </div>
                    <EncoderLegend />
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
