import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Smartphone } from 'lucide-react'
import { useDevices } from '@/hooks/useDevices'

export function ActiveDeviceSelector() {
  const { devices, activeSerial, selectDevice } = useDevices()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = async (serial: string) => {
    await selectDevice(serial)
    setOpen(false)
  }

  if (devices.length === 0) return null

  const activeDevice = devices.find((d) => d.serial === activeSerial)
  const displayLabel = activeDevice
    ? activeDevice.model || activeDevice.product || activeDevice.serial
    : 'Select device'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/50 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/50"
      >
        <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="max-w-[120px] truncate">{displayLabel}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {devices.map((device) => (
            <button
              key={device.serial}
              onClick={() => handleSelect(device.serial)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-accent/50"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">
                  {device.model || device.product || device.serial}
                </span>
                <span className="truncate text-muted-foreground">{device.serial}</span>
              </div>
              {device.serial === activeSerial && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
