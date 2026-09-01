import {
  IconChevronRight as ChevronRight,
  IconHome as Home
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
    <nav className="flex items-center gap-1 text-sm overflow-x-auto">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={item.path} className="flex items-center gap-1 shrink-0">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <button
              onClick={() => onNavigate(item.path)}
              disabled={isLast}
              className={`truncate px-1 py-0.5 rounded text-xs transition-colors ${
                isLast
                  ? 'text-foreground font-medium cursor-default'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {idx === 0 ? <Home className="h-3.5 w-3.5" /> : item.label}
            </button>
          </span>
        )
      })}
    </nav>
  )
}
