import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Search, FolderOpen, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSetupWizardStore } from '@/stores/useSetupWizardStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { selectPlatformToolsDirectory, selectScrcpyDirectory, setCustomBinary, getSetupState } from '@/services/binaryService'
import { PlatformToolsStep } from './PlatformToolsStep'
import { ScrcpyStep } from './ScrcpyStep'

export function BinarySetupStep() {
  const { setupState, loading, prevStep, nextStep, setSetupState, setLoading, setError } =
    useSetupWizardStore()
  const ready = Boolean(setupState?.canFinish)
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleScan = async () => {
    setLoading(true)
    setError(null)
    try {
      const state = await getSetupState()
      setSetupState(state)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlatformToolsFolder = async () => {
    try {
      const sel = await selectPlatformToolsDirectory()
      if (sel.directory) {
        await setCustomBinary('adb', sel.adbPath)
        await setCustomBinary('fastboot', sel.fastbootPath)
        handleScan()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Folder selection failed')
    }
  }

  const handleSelectScrcpyFolder = async () => {
    try {
      const sel = await selectScrcpyDirectory()
      if (sel.directory && sel.scrcpyPath) {
        await setCustomBinary('scrcpy', sel.scrcpyPath)
        handleScan()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Folder selection failed')
    }
  }

  const transition = reduced
    ? 'none'
    : 'opacity 320ms cubic-bezier(0.32, 0.72, 0, 1), transform 320ms cubic-bezier(0.32, 0.72, 0, 1)'

  return (
    <div className="flex w-full flex-col gap-8 text-left">
      <header
        className="flex flex-col gap-2"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)',
          transition,
        }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.6rem]">
          Set up the binaries ADBKit needs.
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Scan the host first, then link or download ADB, Fastboot, and Scrcpy from one workspace.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <PlatformToolsStep embedded />
        <ScrcpyStep embedded autoScan={false} />
      </div>

      <footer
        className="flex flex-col gap-3 border-t border-border/30 pt-5"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)',
          transition: `${transition} 80ms`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleScan}
            disabled={loading}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectPlatformToolsFolder}
              disabled={loading}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <FolderOpen className="h-3.5 w-3.5 mr-1" />
              Select platform-tools folder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectScrcpyFolder}
              disabled={loading}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <FileSearch className="h-3.5 w-3.5 mr-1" />
              Select scrcpy folder
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {ready ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            ) : (
              <span className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
            )}
            <span>
              {ready
                ? 'All binaries detected. Continue to finish setup.'
                : 'Awaiting ADB, Fastboot, and Scrcpy.'}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={prevStep} disabled={loading} className="h-8 gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button onClick={nextStep} disabled={!ready || loading} size="sm" className="h-8 gap-1.5 px-4">
              Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}