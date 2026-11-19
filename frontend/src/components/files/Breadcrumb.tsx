import {
  IconChevronRight,
  IconHome,
} from "@tabler/icons-react"

interface BreadcrumbItem {
  label: string
  path: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  onNavigate: (path: string) => void
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={item.path} className="flex shrink-0 items-center gap-1">
            {idx > 0 && (
              <IconChevronRight
                size={16}
                stroke={1.75}
                className="text-[var(--color-text-secondary)] opacity-50"
              />
            )}
            <button
              onClick={() => { if (!isLast) onNavigate(item.path) }}
              disabled={isLast}
              aria-current={isLast ? 'page' : undefined}
              title={item.path}
              className={`flex max-w-[220px] items-center gap-1.5 truncate rounded-full px-3 py-1.5 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
                isLast
                  ? 'bg-[var(--color-background-muted)] text-[var(--color-text-primary)] cursor-default'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)] active:scale-[0.97]'
              }`}
            >
              {idx === 0 && <IconHome size={16} stroke={1.75} />}
              {idx > 0 && item.label}
            </button>
          </span>
        )
      })}
    </nav>
  )
}
