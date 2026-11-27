import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { IconAlertTriangle, IconShieldCheck, IconTrash } from '@tabler/icons-react'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { DebloatScanItem } from '@/lib/types'

interface DebloaterConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'debloat' | 'disable'
  items: DebloatScanItem[]
  busy?: boolean
  onConfirm: () => Promise<boolean> | void
}

export function DebloaterConfirmDialog({
  open,
  onOpenChange,
  action,
  items,
  busy = false,
  onConfirm,
}: DebloaterConfirmDialogProps) {
  const reduced = useReducedMotion()
  const [ackCaution, setAckCaution] = useState(false)

  useEffect(() => {
    if (open) {
      setAckCaution(false)
    }
  }, [open])

  const safeCount = items.filter((i) => i.risk === 'safe').length
  const cautionItems = items.filter((i) => i.risk === 'caution')
  const autoEnableItems = items.filter((i) => i.autoEnableWarning)
  const hasCaution = cautionItems.length > 0
  const isDebloat = action === 'debloat'
  const canConfirm = !busy && (!hasCaution || ackCaution)

  const samplePkg = items[0]?.packageName ?? '<package>'
  const commandPreview = isDebloat
    ? `adb shell pm uninstall --user 0 ${samplePkg}`
    : `adb shell pm disable-user --user 0 ${samplePkg}`

  const handleConfirm = async () => {
    if (!canConfirm) return
    const ok = await onConfirm()
    if (ok !== false) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog
      isOpen={open}
      onOpenChange={onOpenChange}
      width={520}
      padding={0}
      className="dashboard-scale overflow-hidden rounded-2xl"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div
          className={
            isDebloat
              ? 'flex items-start gap-4 bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-7 pb-5 pt-7'
              : 'flex items-start gap-4 px-7 pb-5 pt-7'
          }
        >
          <div
            className={
              isDebloat
                ? 'mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-error)_16%,transparent)] text-[var(--color-error)]'
                : 'mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]'
            }
          >
            {isDebloat ? <IconTrash size={24} stroke={1.75} /> : <IconAlertTriangle size={24} stroke={1.75} />}
          </div>
          <DialogHeader
            className="min-w-0 flex-1 space-y-1.5 text-left"
            title={
              <span className="block whitespace-normal text-[20px] font-bold leading-snug tracking-tight text-[var(--color-text-primary)]">
                {isDebloat
                  ? `Debloat ${items.length} package(s)`
                  : `Disable ${items.length} package(s)`}
              </span>
            }
            subtitle={
              <span className="block whitespace-normal break-words text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                {isDebloat
                  ? 'Uninstalls packages and clears their app data & cache for user 0. System apps can still be restored in the Restore tab.'
                  : 'Disables packages for user 0 without uninstalling them.'}
              </span>
            }
          />
        </div>

        <div className="space-y-4 px-7 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {safeCount > 0 && <Badge variant="success" label={`${safeCount} Safe`} />}
            {cautionItems.length > 0 && (
              <Badge variant="warning" label={`${cautionItems.length} Caution`} />
            )}
          </div>

          <div className="rounded-xl bg-[var(--color-background-muted)]/50 px-4 py-2.5">
            <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              ADB command preview
            </p>
            <code className="mt-1 block break-all font-mono text-[13px] text-[var(--color-text-primary)]">
              {commandPreview}
            </code>
          </div>

          {!isDebloat && autoEnableItems.length > 0 && (
            <div className="rounded-xl border border-[var(--color-warning)]/40 bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] px-4 py-3 text-[13px] text-[var(--color-text-primary)]">
              <p className="font-semibold text-[var(--color-warning)]">
                MIUI auto-re-enable warning
              </p>
              <p className="mt-0.5 text-[var(--color-text-secondary)]">
                {autoEnableItems.map((i) => i.appName).join(', ')} may re-enable automatically on some MIUI builds when only disabled. Use Debloat (--user 0) for reliable removal.
              </p>
            </div>
          )}

          {hasCaution && (
            <div className="space-y-3 rounded-xl border border-[var(--color-warning)]/40 bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] p-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-warning)]">
                <IconShieldCheck size={18} stroke={1.75} />
                <span>Caution packages require acknowledgement</span>
              </div>
              <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                {cautionItems.map((item) => (
                  <div key={item.packageName} className="text-[13px]">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {item.appName}
                    </span>{' '}
                    <span className="font-mono text-[12px] text-[var(--color-text-secondary)]">
                      ({item.packageName})
                    </span>
                    <p className="text-[var(--color-text-secondary)]">{item.description}</p>
                  </div>
                ))}
              </div>
              <CheckboxInput
                value={ackCaution}
                onChange={setAckCaution}
                size="sm"
                label="I understand the risks for these caution packages"
                isDisabled={busy}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border/40 bg-[var(--color-background-muted)]/50 px-7 py-4">
          <Button
            variant="ghost"
            className="h-11 rounded-xl px-5 text-[14px] font-semibold"
            onClick={() => onOpenChange(false)}
            isDisabled={busy}
            label="Cancel"
          />
          <Button
            variant={isDebloat ? 'destructive' : 'primary'}
            className="h-11 rounded-xl px-5 text-[14px] font-semibold"
            isDisabled={!canConfirm}
            isLoading={busy}
            onClick={handleConfirm}
            label={isDebloat ? 'Debloat (--user 0)' : 'Disable selected'}
          />
        </div>
      </motion.div>
    </Dialog>
  )
}
