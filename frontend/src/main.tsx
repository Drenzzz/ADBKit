import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppErrorBoundary } from '@/components/common/ErrorBoundary'
import { router } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'text-sm',
        }}
        richColors
        closeButton
      />
    </AppErrorBoundary>
  </React.StrictMode>,
)
