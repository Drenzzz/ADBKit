import { create } from 'zustand'
import type {
  BinaryName,
  SetupState,
  SetupWizardState,
  SetupWizardStep,
} from '@/lib/types'

const STEPS: SetupWizardStep[] = ['welcome', 'platform-tools', 'scrcpy', 'summary']

interface SetupWizardActions {
  setCurrentStep: (step: SetupWizardStep) => void
  nextStep: () => void
  prevStep: () => void
  setSetupState: (state: SetupState | null) => void
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  setSelectedPath: (name: BinaryName, path: string) => void
  clearSelectedPath: (name: BinaryName) => void
  hydrateFromSetupState: (setupState: SetupState) => void
  reset: () => void
}

type SetupWizardStore = SetupWizardState & SetupWizardActions

const initialState: SetupWizardState = {
  currentStep: 'welcome',
  setupState: null,
  loading: false,
  submitting: false,
  error: null,
  selectedPaths: {},
}

export const useSetupWizardStore = create<SetupWizardStore>()((set, get) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step, error: null }),

  nextStep: () => {
    const { currentStep } = get()
    const idx = STEPS.indexOf(currentStep)
    if (idx < STEPS.length - 1) {
      set({ currentStep: STEPS[idx + 1], error: null })
    }
  },

  prevStep: () => {
    const { currentStep } = get()
    const idx = STEPS.indexOf(currentStep)
    if (idx > 0) {
      set({ currentStep: STEPS[idx - 1], error: null })
    }
  },

  setSetupState: (setupState) => set({ setupState }),

  setLoading: (loading) => set({ loading }),

  setSubmitting: (submitting) => set({ submitting }),

  setError: (error) => set({ error, submitting: false }),

  setSelectedPath: (name, path) =>
    set((state) => ({
      selectedPaths: { ...state.selectedPaths, [name]: path },
    })),

  clearSelectedPath: (name) =>
    set((state) => {
      const next = { ...state.selectedPaths }
      delete next[name]
      return { selectedPaths: next }
    }),

  hydrateFromSetupState: (setupState) =>
    set({
      setupState,
      selectedPaths: {
        adb: setupState.status?.adb?.path ?? '',
        fastboot: setupState.status?.fastboot?.path ?? '',
        scrcpy: setupState.status?.scrcpy?.path ?? '',
      },
    }),

  reset: () => set(initialState),
}))
