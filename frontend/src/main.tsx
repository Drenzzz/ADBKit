import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Theme } from '@astryxdesign/core/theme'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppErrorBoundary } from '@/components/common/ErrorBoundary'
import { router } from './App'
import { useUIStore } from '@/stores/useUIStore'
import { themes, defaultThemeSlug } from './astryx-themes'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ThemedApp() {
  const theme = useUIStore((s) => s.theme)
  return (
    <Theme theme={themes[defaultThemeSlug]} mode={theme}>
      <TooltipProvider delay={150}>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-right"
          theme={theme}
          closeButton
        />
      </TooltipProvider>
    </Theme>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemedApp />
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
