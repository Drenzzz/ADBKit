import { create } from 'zustand'
import type {
  BinaryName,
  SetupState,
  SetupWizardState,
  SetupWizardStep,
} from '@/lib/types'

const STEPS: SetupWizardStep[] = ['welcome', 'setup-binary', 'finish']

const DRAFT_KEY = 'adbkit-setup-draft'

interface DraftPayload {
  selectedPaths: Partial<Record<BinaryName, string>>
  currentStep: SetupWizardStep | 'platform-tools' | 'scrcpy' | 'summary'
}

function normalizeStep(step: unknown): SetupWizardStep {
  switch (step) {
    case 'setup-binary':
    case 'platform-tools':
    case 'scrcpy':
      return 'setup-binary'
    case 'finish':
    case 'summary':
      return 'finish'
    case 'welcome':
      return 'welcome'
    default:
      return 'welcome'
  }
}

function readDraft(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as DraftPayload
  } catch {
    // corrupted draft — ignore
  }
  return null
}

function writeDraft(payload: DraftPayload) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
  } catch {
    // localStorage full or blocked — silent
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

function restoreDraft(): Partial<SetupWizardState> {
  const draft = readDraft()
  if (!draft) return {}
  return {
    selectedPaths: draft.selectedPaths ?? {},
    currentStep: normalizeStep(draft.currentStep),
  }
}

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
  ...restoreDraft(),

  setCurrentStep: (step) => {
    set({ currentStep: step, error: null })
    writeDraft({ selectedPaths: get().selectedPaths, currentStep: step })
  },

  nextStep: () => {
    const { currentStep, selectedPaths } = get()
    const idx = STEPS.indexOf(currentStep)
    if (idx < STEPS.length - 1) {
      const next = STEPS[idx + 1]
      set({ currentStep: next, error: null })
      writeDraft({ selectedPaths, currentStep: next })
    }
  },

  prevStep: () => {
    const { currentStep, selectedPaths } = get()
    const idx = STEPS.indexOf(currentStep)
    if (idx > 0) {
      const prev = STEPS[idx - 1]
      set({ currentStep: prev, error: null })
      writeDraft({ selectedPaths, currentStep: prev })
    }
  },

  setSetupState: (setupState) => set({ setupState }),

  setLoading: (loading) => set({ loading }),

  setSubmitting: (submitting) => set({ submitting }),

  setError: (error) => set({ error, submitting: false }),

  setSelectedPath: (name, path) => {
    const next = { ...get().selectedPaths, [name]: path }
    set({ selectedPaths: next })
    writeDraft({ selectedPaths: next, currentStep: get().currentStep })
  },

  clearSelectedPath: (name) => {
    const next = { ...get().selectedPaths }
    delete next[name]
    set({ selectedPaths: next })
    writeDraft({ selectedPaths: next, currentStep: get().currentStep })
  },

  hydrateFromSetupState: (setupState) => {
    const paths: Partial<Record<BinaryName, string>> = {
      adb: setupState.status?.adb?.path ?? '',
      fastboot: setupState.status?.fastboot?.path ?? '',
      scrcpy: setupState.status?.scrcpy?.path ?? '',
    }
    set({
      setupState,
      selectedPaths: paths,
    })
    writeDraft({ selectedPaths: paths, currentStep: get().currentStep })
  },

  reset: () => {
    clearDraft()
    set(initialState)
  },
}))
