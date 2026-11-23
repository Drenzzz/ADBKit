import { RouterProvider } from 'react-router-dom'
import { Theme } from '@astryxdesign/core/theme'
import { LayerProvider } from '@astryxdesign/core/Layer'
import { ToastBridge } from '@/components/common/ToastBridge'
import { useUIStore } from '@/stores/useUIStore'
import { themes, defaultThemeSlug } from '@/astryx-themes'
import { router } from '@/App'

export function ThemedApp() {
  const theme = useUIStore((s) => s.theme)
  return (
    <Theme theme={themes[defaultThemeSlug]} mode={theme}>
      <LayerProvider>
        <ToastBridge />
        <RouterProvider router={router} />
      </LayerProvider>
    </Theme>
  )
}