interface ScreenshotFlashProps {
  visible: boolean
}

export function ScreenshotFlash({ visible }: ScreenshotFlashProps) {
  if (!visible) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 bg-white/60 transition-opacity duration-200"
    />
  )
}
