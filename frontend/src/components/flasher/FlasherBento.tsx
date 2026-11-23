import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FlasherHeader } from '@/components/flasher/FlasherHeader'
import { PartitionFlashCard } from '@/components/flasher/cards/PartitionFlashCard'
import { RomFlashCard } from '@/components/flasher/cards/RomFlashCard'
import { SideloadCard } from '@/components/flasher/cards/SideloadCard'
import { WipeDataCard } from '@/components/flasher/cards/WipeDataCard'
import { WakeOnFastbootCard } from '@/components/flasher/cards/WakeOnFastbootCard'
import { Step } from '@/components/flasher/shared/Step'
import { useFlasher } from '@/hooks/useFlasher'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import {
  IconBolt,
  IconBox,
  IconFolderSearch,
  IconPower,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react"

type TaskId = 'image' | 'rom' | 'sideload' | 'power' | 'wipe'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const TASKS: { id: TaskId; label: string; hint: string; needs: string; icon: typeof IconBolt }[] = [
  { id: 'image', label: 'Flash Image', hint: 'Single .img to a partition', needs: 'Needs fastboot', icon: IconBolt },
  { id: 'rom', label: 'Flash ROM', hint: 'Batch flash a folder', needs: 'Needs fastboot', icon: IconFolderSearch },
  { id: 'sideload', label: 'Sideload', hint: 'ZIP via recovery', needs: 'Needs sideload mode', icon: IconBox },
  { id: 'power', label: 'Power & Wake', hint: 'Wake, unlock, continue boot', needs: 'Needs a device', icon: IconPower },
]

export function FlasherBento() {
  const { deviceMode, refreshingDevices, syncFastbootDevices } = useFlasher()
  const reduced = useReducedMotion()
  const [task, setTask] = useState<TaskId>('image')

  const isFastboot = deviceMode === 'fastboot' || deviceMode === 'fastbootd'
  const isSideload = deviceMode === 'sideload'
  const hasDevice = isFastboot || isSideload

  // Follow the device mode: sideload jumps to its task, fastboot leaves it.
  useEffect(() => {
    if (deviceMode === 'sideload') setTask('sideload')
    else if (deviceMode === 'fastboot' || deviceMode === 'fastbootd') {
      setTask((t) => (t === 'sideload' ? 'image' : t))
    }
  }, [deviceMode])

  const available = (id: TaskId) => {
    if (!hasDevice) return false
    if (id === 'sideload') return isSideload
    if (id === 'power') return true
    return isFastboot
  }

  const workspaceKey = hasDevice ? task : 'connect'

  return (
    <div className="dashboard-scale flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-5 lg:flex-row lg:overflow-visible">
      <motion.aside
        initial={reduced ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="m3-surface flex shrink-0 flex-col gap-4 rounded-3xl p-4 lg:min-h-0 lg:w-[300px]"
      >
        <FlasherHeader />
        <div className="h-px shrink-0 bg-border/40" />
        <nav aria-label="Flasher tasks" className="flex gap-1.5 overflow-x-auto lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
          {TASKS.map(({ id, label, hint, needs, icon: Icon }) => {
            const isActive = hasDevice && task === id
            const isAvailable = available(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTask(id)}
                disabled={!isAvailable}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-[background-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 lg:w-full',
                  !isAvailable && 'opacity-40',
                  isAvailable && !isActive && 'hover:bg-[var(--color-background-card)]/60',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="flasher-task-active"
                    transition={reduced ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    className="absolute inset-0 rounded-2xl bg-[var(--color-background-card)]"
                  />
                )}
                <Icon size={20} stroke={1.75} className={cn('relative z-10 shrink-0', isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]')} />
                <span className="relative z-10 min-w-0">
                  <span className={cn('block whitespace-nowrap text-[16px] font-semibold', isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]')}>
                    {label}
                  </span>
                  <span className="block whitespace-nowrap text-[14px] text-[var(--color-text-secondary)]">
                    {isAvailable ? hint : needs}
                  </span>
                </span>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => setTask('wipe')}
            disabled={!available('wipe')}
            aria-current={hasDevice && task === 'wipe' ? 'page' : undefined}
            className={cn(
              'relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-[background-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-error)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 lg:mt-auto lg:w-full',
              !available('wipe') && 'opacity-40',
              available('wipe') && task !== 'wipe' && 'hover:bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)]',
            )}
          >
            {hasDevice && task === 'wipe' && (
              <motion.span
                layoutId="flasher-task-active"
                transition={reduced ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute inset-0 rounded-2xl bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]"
              />
            )}
            <IconTrash size={20} stroke={1.75} className="relative z-10 shrink-0 text-[var(--color-error)]" />
            <span className="relative z-10 min-w-0">
              <span className="block whitespace-nowrap text-[16px] font-semibold text-[var(--color-error)]">Wipe Data</span>
              <span className="block whitespace-nowrap text-[14px] text-[var(--color-text-secondary)]">
                {available('wipe') ? 'Factory reset' : 'Needs fastboot'}
              </span>
            </span>
          </button>
        </nav>
      </motion.aside>

      <main className="m3-surface min-h-[480px] flex-1 rounded-3xl p-6 lg:min-h-0 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={workspaceKey}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
            transition={{ duration: reduced ? 0.12 : 0.25, ease: EASE }}
            className="h-full min-h-0"
          >
            {!hasDevice && <ConnectGuide refreshing={refreshingDevices} onRefresh={() => syncFastbootDevices(true)} />}
            {hasDevice && task === 'image' && <PartitionFlashCard />}
            {hasDevice && task === 'rom' && <RomFlashCard />}
            {hasDevice && task === 'sideload' && <SideloadCard />}
            {hasDevice && task === 'power' && <WakeOnFastbootCard />}
            {hasDevice && task === 'wipe' && <WipeDataCard />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function ConnectGuide({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-8">
        <h3 className="text-[26px] font-bold tracking-tight text-[var(--color-text-primary)]">Connect a device</h3>
        <p className="mt-1 text-[16px] text-[var(--color-text-secondary)]">
          The flasher works over fastboot or recovery sideload. Pick the mode you need:
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto pr-1">
        <Step n={1} label="Fastboot: flash images, ROM folders, wipe">
          <p className="max-w-2xl text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
            Power the phone off, then hold <span className="font-semibold text-[var(--color-text-primary)]">Vol Down</span> while
            plugging the USB cable (the common bootloader combo). The device lands in fastboot and the flash tasks become available.
          </p>
        </Step>
        <Step n={2} label="Sideload: install a ZIP from recovery">
          <p className="max-w-2xl text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
            Boot into recovery and choose <span className="font-semibold text-[var(--color-text-primary)]">Apply update from ADB</span>.
            The device shows up in sideload mode and the Sideload task becomes available.
          </p>
        </Step>
      </div>

      <footer className="mt-6 flex items-center justify-between gap-4 border-t border-border/40 pt-5">
        <p className="text-[16px] text-[var(--color-text-secondary)]">Already connected? Rescan the bus.</p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-8 text-[16px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
        >
          <IconRefresh size={18} stroke={1.75} className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined} />
          {refreshing ? 'Scanning…' : 'Refresh Devices'}
        </button>
      </footer>
    </div>
  )
}