import { useEffect, type ReactNode } from 'react'
import { useToast, type ShowToastFn, type ToastOptions } from '@astryxdesign/core/Toast'
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconLoader2,
} from '@tabler/icons-react'

let show: ShowToastFn | null = null
const pending: ToastOptions[] = []
let seq = 0

// Registers the Astryx show function once so services and hooks can keep the
// sonner-shaped call API without calling a hook outside components.
export function ToastBridge() {
  const showToast = useToast()
  useEffect(() => {
    show = showToast
    pending.splice(0).forEach((options) => showToast(options))
    return () => {
      show = null
    }
  }, [showToast])
  return null
}

function emit(options: ToastOptions) {
  if (show) show(options)
  else pending.push(options)
}

interface ToastMeta {
  description?: ReactNode
  duration?: number
}

function body(title: ReactNode, meta: ToastMeta | undefined, icon: ReactNode) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-text-primary)]">
        {icon}
        {title}
      </span>
      {meta?.description ? (
        <span className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {meta.description}
        </span>
      ) : null}
    </span>
  )
}

const icons = {
  success: <IconCircleCheck size={18} stroke={1.75} className="shrink-0 text-[var(--color-success)]" />,
  error: <IconAlertTriangle size={18} stroke={1.75} className="shrink-0 text-[var(--color-error)]" />,
  warning: <IconAlertTriangle size={18} stroke={1.75} className="shrink-0 text-[var(--color-warning)]" />,
  info: <IconInfoCircle size={18} stroke={1.75} className="shrink-0 text-[var(--color-text-secondary)]" />,
  loading: <IconLoader2 size={18} stroke={1.75} className="shrink-0 animate-spin text-[var(--color-text-secondary)] motion-reduce:animate-none" />,
}

function autoHide(meta: ToastMeta | undefined, fallback: number) {
  return { isAutoHide: true, autoHideDuration: meta?.duration ?? fallback }
}

export const toast = {
  success(title: ReactNode, meta?: ToastMeta) {
    emit({ body: body(title, meta, icons.success), type: 'info', ...autoHide(meta, 5000) })
  },
  error(title: ReactNode, meta?: ToastMeta) {
    emit({ body: body(title, meta, icons.error), type: 'error', ...autoHide(meta, 6000) })
  },
  info(title: ReactNode, meta?: ToastMeta) {
    emit({ body: body(title, meta, icons.info), type: 'info', ...autoHide(meta, 5000) })
  },
  warning(title: ReactNode, meta?: ToastMeta) {
    emit({ body: body(title, meta, icons.warning), type: 'info', ...autoHide(meta, 5000) })
  },
  message(title: ReactNode, meta?: ToastMeta) {
    toast.info(title, meta)
  },
  promise<T>(
    promise: Promise<T>,
    meta: {
      loading: ReactNode
      success: ReactNode | ((data: T) => ReactNode)
      error: ReactNode | ((err: unknown) => ReactNode)
    },
  ): Promise<T> {
    const uniqueID = `toast-promise-${++seq}`
    emit({ body: body(meta.loading, undefined, icons.loading), type: 'info', isAutoHide: false, uniqueID })
    return promise.then(
      (data) => {
        emit({
          body: body(typeof meta.success === 'function' ? meta.success(data) : meta.success, undefined, icons.success),
          type: 'info',
          uniqueID,
          collisionBehavior: 'overwrite',
          ...autoHide(undefined, 5000),
        })
        return data
      },
      (err) => {
        emit({
          body: body(typeof meta.error === 'function' ? meta.error(err) : meta.error, undefined, icons.error),
          type: 'error',
          uniqueID,
          collisionBehavior: 'overwrite',
          ...autoHide(undefined, 6000),
        })
        throw err
      },
    )
  },
}