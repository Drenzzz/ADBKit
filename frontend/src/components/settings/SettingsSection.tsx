import type { ReactNode } from 'react'

interface SettingsSectionProps {
  icon: ReactNode
  title: string
  action?: ReactNode
  children: ReactNode
}

export function SettingsSection({ icon, title, action, children }: SettingsSectionProps) {
  return (
    <section className="m3-surface rounded-3xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[var(--color-text-primary)]">
          <span className="text-[var(--color-text-secondary)]">{icon}</span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}