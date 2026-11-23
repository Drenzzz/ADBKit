import { motion } from 'motion/react'
import {
  IconAlertTriangle,
  IconTrash,
} from '@tabler/icons-react'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Button } from '@astryxdesign/core/Button'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const reduced = useReducedMotion()
  const destructive = variant === 'destructive'
  const Icon = destructive ? IconTrash : IconAlertTriangle

  return (
    <Dialog
      isOpen={open}
      onOpenChange={onOpenChange}
      width={512}
      padding={0}
      className="dashboard-scale overflow-hidden rounded-2xl"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 26 }}
      >
        <div
          className={
            destructive
              ? 'flex items-start gap-4 bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-7 pb-6 pt-7'
              : 'flex items-start gap-4 px-7 pb-6 pt-7'
          }
        >
          <div
            className={
              destructive
                ? 'mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-error)_16%,transparent)] text-[var(--color-error)]'
                : 'mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]'
            }
          >
            <Icon size={24} stroke={1.75} />
          </div>
          <DialogHeader
            className="space-y-1.5 text-left"
            title={
              <span className="text-[20px] font-bold leading-snug tracking-tight text-[var(--color-text-primary)]">
                {title}
              </span>
            }
            subtitle={
              <span className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                {description}
              </span>
            }
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border/40 bg-[var(--color-background-muted)]/50 px-7 py-4">
          <Button
            variant="ghost"
            className="h-11 rounded-xl px-5 text-[14px] font-semibold"
            onClick={() => onOpenChange(false)}
            label="Cancel"
          />
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            className="h-11 rounded-xl px-5 text-[14px] font-semibold"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            label={confirmLabel}
          />
        </div>
      </motion.div>
    </Dialog>
  )
}