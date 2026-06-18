import { useState } from 'react'
import { Pencil, Smartphone, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DeviceDetailPanel } from '@/components/devices/DeviceDetailPanel'
import { DeviceActions } from '@/components/devices/DeviceActions'
import { PerformancePanel } from '@/components/devices/PerformancePanel'
import { RenameDialog } from '@/components/devices/RenameDialog'
import { DeviceSidebar } from '@/components/devices/DeviceSidebar'
import { SidebarStatusPanel } from '@/components/devices/SidebarStatusPanel'
import { useDevices } from '@/hooks/useDevices'
import { useMonitor } from '@/hooks/useMonitor'

function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h >= 24) {
    const d = Math.floor(h / 24)
    const rh = h % 24
    return `${d}d ${rh}h ${m}m`
  }
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 350, damping: 26 },
  },
}

export default function DevicesPage() {
  const { activeSerial, deviceInfo, nicknames, deviceMode } = useDevices()
  const [renameOpen, setRenameOpen] = useState(false)

  const isOnline = deviceMode === 'adb' && deviceInfo?.state === 'device'
  const { snapshot, error: monitorError } = useMonitor(activeSerial ?? '', isOnline)

  const displayName = activeSerial
    ? (nicknames[activeSerial] || deviceInfo?.model || deviceInfo?.product || activeSerial)
    : ''

  return (
    <div className="flex h-full gap-4 overflow-hidden font-sans">
      <DeviceSidebar />

      <div className="flex flex-1 min-w-0 flex-col gap-5 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Device Manager</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {displayName
                ? `Managing: ${displayName}`
                : 'Select a device from the sidebar to begin.'}
            </p>
          </div>
          {activeSerial && (
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={() => setRenameOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Rename Device
            </Button>
          )}
        </div>

        {activeSerial ? (
          <motion.div
            key={activeSerial}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Left 2 Columns */}
              <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-5">
                <DeviceActions />
                {isOnline && (
                  <>
                    <PerformancePanel snapshot={snapshot} error={monitorError} />
                    {snapshot && (
                      <Card className="border border-border/60 bg-card shadow-[var(--shadow-card)]">
                        <CardContent className="flex items-center justify-between p-4 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground font-semibold uppercase tracking-wider">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>System Uptime</span>
                          </div>
                          <span className="text-xs font-bold text-foreground font-mono">
                            {formatUptime(snapshot.uptimeSeconds)}
                          </span>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </motion.div>

              {/* Right 1 Column */}
              <motion.div variants={itemVariants} className="lg:col-span-1 flex flex-col gap-5">
                {isOnline && snapshot && (
                  <SidebarStatusPanel snapshot={snapshot} />
                )}
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <DeviceDetailPanel />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center border border-border/60 bg-card rounded-xl p-8 min-h-[350px] text-center gap-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 border border-border/60 text-muted-foreground">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                No Device Selected
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a device from the sidebar to view technical specifications, manage actions, and monitor live telemetry.
              </p>
            </div>
          </motion.div>
        )}

        {renameOpen && activeSerial && (
          <RenameDialog
            serial={activeSerial}
            currentNickname={nicknames[activeSerial] ?? ''}
            onClose={() => setRenameOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
