import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Step({ n, label, children, fill }: { n: number; label: string; children?: ReactNode; fill?: boolean }) {
  return (
    <section className={cn('space-y-3.5', fill ? 'flex min-h-0 flex-1 flex-col' : 'shrink-0')}>
      <h4 className="flex items-center gap-3 text-[16px] font-semibold text-[var(--color-text-primary)]">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-inset)] text-[14px] font-bold text-[var(--color-text-secondary)]">
          {n}
        </span>
        {label}
      </h4>
      {fill ? <div className="min-h-0 flex-1">{children}</div> : children}
    </section>
  )
}