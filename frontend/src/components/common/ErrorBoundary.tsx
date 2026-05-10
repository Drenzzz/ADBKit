import { ErrorBoundary } from 'react-error-boundary'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

function RouteErrorFallback() {
  const error = useRouteError() as unknown
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error'

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-lg font-semibold text-destructive">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function GlobalErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown
  resetErrorBoundary: () => void
}) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div>
        <h1 className="text-lg font-semibold text-destructive">Application Error</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <button
        onClick={resetErrorBoundary}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  )
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={GlobalErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  )
}

export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={RouteErrorFallback}>
      {children}
    </ErrorBoundary>
  )
}
