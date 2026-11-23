import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// index.css must load BEFORE astryx-themes so the @layer order statement
// (reset, theme, base, astryx-base...) registers before violet-ink.css
// declares its own layer order; otherwise Tailwind's base layer beats
// astryx-base and every Astryx control loses its chrome.
import './index.css'
import { AppErrorBoundary } from '@/components/common/ErrorBoundary'
import { ThemedApp } from '@/components/common/ThemedApp'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemedApp />
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
