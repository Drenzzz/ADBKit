import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppErrorBoundary } from '@/components/common/ErrorBoundary'
import { router } from './App'
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

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={150}>
          <RouterProvider router={router} />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'text-sm',
            }}
            richColors
            closeButton
          />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
