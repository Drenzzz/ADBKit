import type { ReactNode } from 'react'
import type { ShowToastFn, ToastOptions } from '@astryxdesign/core/Toast'

export interface ToastContent {
  title: ReactNode
  description?: ReactNode
  tone?: 'success' | 'error' | 'warning' | 'info' | 'loading'
}

let show: ShowToastFn | null = null
const pending: ToastOptions[] = []
let seq = 0

// Registers the Astryx show function once so services and hooks can keep the
// sonner-shaped call API without calling a hook outside components.
export function registerToastShow(showToast: ShowToastFn) {
  show = showToast
  pending.splice(0).forEach((options) => showToast(options))
}

export function unregisterToastShow() {
  show = null
}

function emit(content: ToastContent, type: 'info' | 'error', extra: Partial<ToastOptions> = {}) {
  const options: ToastOptions = { body: content as unknown as ToastOptions['body'], type, ...extra }
  if (show) show(options)
  else pending.push(options)
}

export const toast = {
  success(title: ReactNode, meta?: { description?: ReactNode; duration?: number }) {
    emit({ title, description: meta?.description, tone: 'success' }, 'info', {
      isAutoHide: true,
      autoHideDuration: meta?.duration ?? 5000,
    })
  },
  error(title: ReactNode, meta?: { description?: ReactNode; duration?: number }) {
    emit({ title, description: meta?.description, tone: 'error' }, 'error', {
      isAutoHide: true,
      autoHideDuration: meta?.duration ?? 6000,
    })
  },
  info(title: ReactNode, meta?: { description?: ReactNode; duration?: number }) {
    emit({ title, description: meta?.description, tone: 'info' }, 'info', {
      isAutoHide: true,
      autoHideDuration: meta?.duration ?? 5000,
    })
  },
  warning(title: ReactNode, meta?: { description?: ReactNode; duration?: number }) {
    emit({ title, description: meta?.description, tone: 'warning' }, 'info', {
      isAutoHide: true,
      autoHideDuration: meta?.duration ?? 5000,
    })
  },
  message(title: ReactNode, meta?: { description?: ReactNode; duration?: number }) {
    toast.info(title, meta)
  },
  promise<T>(
    promise: Promise<T>,
    meta: {
      loading: ReactNode
      success: ReactNode | ((data: T) => unknown)
      error: ReactNode | ((err: ReactNode) => unknown)
    },
  ): Promise<T> {
    const uniqueID = `toast-promise-${++seq}`
    emit({ title: meta.loading, tone: 'loading' }, 'info', { isAutoHide: false, uniqueID })
    return promise.then(
      (data) => {
        emit(
          { title: typeof meta.success === 'function' ? (meta.success as (d: T) => ReactNode)(data) : meta.success, tone: 'success' },
          'info',
          { uniqueID, collisionBehavior: 'overwrite', isAutoHide: true, autoHideDuration: 5000 },
        )
        return data
      },
      (err) => {
        emit(
          { title: typeof meta.error === 'function' ? (meta.error as (e: unknown) => ReactNode)(err) : meta.error, tone: 'error' },
          'error',
          { uniqueID, collisionBehavior: 'overwrite', isAutoHide: true, autoHideDuration: 6000 },
        )
        throw err
      },
    )
  },
}
