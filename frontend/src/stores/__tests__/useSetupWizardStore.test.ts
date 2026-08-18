import { beforeEach, describe, expect, it } from 'vitest'
import { useSetupWizardStore } from '../useSetupWizardStore'

describe('useSetupWizardStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSetupWizardStore.getState().reset()
  })

  it('moves through welcome, binary setup, and finish', () => {
    const store = useSetupWizardStore.getState()

    expect(store.currentStep).toBe('welcome')

    store.nextStep()
    expect(useSetupWizardStore.getState().currentStep).toBe('setup-binary')

    useSetupWizardStore.getState().nextStep()
    expect(useSetupWizardStore.getState().currentStep).toBe('finish')

    useSetupWizardStore.getState().prevStep()
    expect(useSetupWizardStore.getState().currentStep).toBe('setup-binary')
  })
})
