import { useState, useEffect } from 'react'
import { IconDeviceSdCard } from '@tabler/icons-react'
import { Popover } from '@astryxdesign/core/Popover'
import { listSdCards } from '@/services/fileService'
import type { SdCard } from '@/lib/types'

interface SdCardPickerProps {
  onSelect: (mountPoint: string) => void
  disabled?: boolean
}

export function SdCardPicker({ onSelect, disabled }: SdCardPickerProps) {
  const [cards, setCards] = useState<SdCard[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listSdCards()
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }, [open])

  const externalCards = cards.filter((c) => c.isExternal)

  return (
    <Popover
      isOpen={open}
      onOpenChange={setOpen}
      placement="below"
      alignment="end"
      width={256}
      padding={2}
      label="Storage volumes"
      content={
        <>
          {loading && (
            <p className="text-[14px] text-muted-foreground px-2 py-1">Detecting volumes…</p>
          )}
          {!loading && externalCards.length === 0 && cards.length === 0 && (
            <p className="text-[14px] text-muted-foreground px-2 py-1">
              No storage volumes detected.
            </p>
          )}
          {!loading && externalCards.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[14px] font-semibold text-muted-foreground px-2 py-1">
                External SD cards
              </p>
              {externalCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    onSelect(card.mountPoint)
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-[14px] hover:bg-accent text-left transition-colors cursor-pointer"
                >
                  <IconDeviceSdCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{card.description}</span>
                    <span className="block truncate text-[13px] text-muted-foreground font-mono">
                      {card.mountPoint}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {!loading && cards.length > 0 && externalCards.length === 0 && (
            <div className="space-y-0.5">
              <p className="text-[14px] font-semibold text-muted-foreground px-2 py-1">
                Internal storage
              </p>
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    onSelect(card.mountPoint)
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-[14px] hover:bg-accent text-left transition-colors cursor-pointer"
                >
                  <IconDeviceSdCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{card.description}</span>
                    <span className="block truncate text-[13px] text-muted-foreground font-mono">
                      {card.mountPoint}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      }
    >
      <button
        type="button"
        disabled={disabled}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IconDeviceSdCard className="h-3.5 w-3.5" />
        Storage
      </button>
    </Popover>
  )
}
