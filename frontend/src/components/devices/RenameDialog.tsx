import { useState } from 'react'
import {
  IconPencil as Pencil,
  IconX as X,
  IconLoader2 as Loader2
} from "@tabler/icons-react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setDeviceNickname, clearDeviceNickname } from '@/services/deviceService'
import { useDevices } from '@/hooks/useDevices'
import { toast } from 'sonner'

export function RenameDialog({ serial, currentNickname, onClose }: {
  serial: string
  currentNickname: string
  onClose: () => void
}) {
  const { setNickname: setLocalNickname } = useDevices()
  const [draft, setDraft] = useState(currentNickname)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = draft.trim()
    setSaving(true)
    try {
      if (trimmed) {
        await setDeviceNickname(serial, trimmed)
        setLocalNickname(serial, trimmed)
        toast.success('Device renamed', { description: `Nickname set to "${trimmed}"` })
      } else {
        await clearDeviceNickname(serial)
        setLocalNickname(serial, '')
        toast.success('Nickname cleared')
      }
      onClose()
    } catch (e) {
      toast.error('Failed to save nickname', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-popover p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Rename device</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Serial</p>
            <p className="font-mono text-sm">{serial}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nickname" className="text-xs font-medium text-muted-foreground">Nickname</label>
            <Input
              id="nickname"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. Daily Driver"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Pencil className="mr-1.5 h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
