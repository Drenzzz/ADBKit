import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MarqueeTextProps {
  children: ReactNode
  className?: string
  title?: string
}

// Long labels rest as an ellipsis and walk on hover so the full text stays reachable.
export function MarqueeText({ children, className, title }: MarqueeTextProps) {
  const ref = useRef<HTMLSpanElement>(null)

  const handleEnter = () => {
    const el = ref.current
    if (!el) return
    const shift = Math.max(el.scrollWidth - el.clientWidth, 0)
    el.style.setProperty('--marquee-shift', `${shift}px`)
    el.style.setProperty('--marquee-dur', `${Math.max(shift / 40, 1)}s`)
  }

  return (
    <span
      ref={ref}
      title={title}
      onMouseEnter={handleEnter}
      className={cn('marquee-hover block min-w-0 truncate', className)}
    >
      {children}
    </span>
  )
}