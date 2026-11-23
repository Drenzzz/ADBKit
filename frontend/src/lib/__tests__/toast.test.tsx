import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Theme } from '@astryxdesign/core/theme'
import { LayerProvider } from '@astryxdesign/core/Layer'
import { themes, defaultThemeSlug } from '@/astryx-themes'
import { ToastBridge } from '@/components/common/ToastBridge'
import { toast } from '@/lib/toast'

function setup() {
  return render(
    <Theme theme={themes[defaultThemeSlug]} mode="dark">
      <LayerProvider>
        <ToastBridge />
      </LayerProvider>
    </Theme>,
  )
}

describe('toast bridge', () => {
  it('renders success title and description', async () => {
    setup()
    toast.success('Saved', { description: 'path/x' })
    await waitFor(() => expect(screen.getByText('Saved')).toBeTruthy())
    expect(screen.getByText('path/x')).toBeTruthy()
  })

  it('promise replaces the loading toast with the success message', async () => {
    setup()
    let resolve!: (msg: string) => void
    const deferred = new Promise<string>((r) => {
      resolve = r
    })
    const pending = toast.promise(deferred, {
      loading: 'Working',
      success: (msg) => msg,
      error: 'bad',
    })
    await waitFor(() => expect(screen.getByText('Working')).toBeTruthy())
    resolve('done msg')
    await pending
    await waitFor(() => expect(screen.getByText('done msg')).toBeTruthy())
    expect(screen.queryByText('Working')).toBeNull()
  })

  it('promise rejection surfaces the error message', async () => {
    setup()
    const pending = toast.promise(Promise.reject(new Error('boom')), {
      loading: 'Working',
      success: 'ok',
      error: (err) => (err as Error).message,
    })
    await expect(pending).rejects.toThrow('boom')
    await waitFor(() => expect(screen.getByText('boom')).toBeTruthy())
  })
})