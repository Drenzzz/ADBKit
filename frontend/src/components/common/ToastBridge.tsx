import { useEffect, type ReactNode } from 'react'
import { useToast, type ShowToastFn, type ToastOptions } from '@astryxdesign/core/Toast'
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconLoader2,
} from '@tabler/icons-react'
import { registerToastShow, unregisterToastShow, type ToastContent } from '@/lib/toast'

function ToastBody({ content }: { content: ToastContent }) {
  const tone = content.tone ?? 'info'
  const icon =
    tone === 'success'
      ? <IconCircleCheck size={18} stroke={1.75} className="shrink-0 text-[var(--color-success)]" />
      : tone === 'error'
        ? <IconAlertTriangle size={18} stroke={1.75} className="shrink-0 text-[var(--color-error)]" />
        : tone === 'warning'
          ? <IconAlertTriangle size={18} stroke={1.75} className="shrink-0 text-[var(--color-warning)]" />
          : tone === 'loading'
            ? <IconLoader2 size={18} stroke={1.75} className="shrink-0 animate-spin text-[var(--color-text-secondary)] motion-reduce:animate-none" />
            : <IconInfoCircle size={18} stroke={1.75} className="shrink-0 text-[var(--color-text-secondary)]" />

  return (
    <span className="flex flex-col gap-0.5">
      <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-text-primary)]">
        {icon}
        {content.title as ReactNode}
      </span>
      {content.description ? (
        <span className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {content.description as ReactNode}
        </span>
      ) : null}
    </span>
  )
}

export function ToastBridge() {
  const showToast = useToast()
  useEffect(() => {
    const wrapped = (options: ToastOptions) => {
      showToast({
        ...options,
        body: <ToastBody content={options.body as unknown as ToastContent} />,
      })
    }
    registerToastShow(wrapped as ShowToastFn)
    return () => unregisterToastShow()
  }, [showToast])
  return null
}