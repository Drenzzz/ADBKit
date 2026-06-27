import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  FlasherState,
  FlasherActions,
  FlashPlan,
  FlashPlanStepStatus,
  OperationStatus,
} from '@/lib/types'

const initialState: FlasherState = {
  fastbootDevices: [],
  activeFastbootSerial: '',
  deviceMode: null,
  isUserspace: false,
  selectedPartition: '',
  selectedImagePath: '',
  romFolderPath: '',
  flashPlan: null,
  flashPlanSteps: [],
  selectedPartitions: [],
  currentSlot: '',
  customCommand: '',
  customCommandOutput: '',
  sideloadFilePath: '',
  loadingDevices: false,
  refreshingDevices: false,
  scanningPlan: false,
  runningFlash: false,
  runningBatchFlash: false,
  runningWipe: false,
  runningSideload: false,
  runningSlotChange: false,
  runningCommand: false,
  error: null,
  lastUpdatedAt: null,
}

function createPlanSteps(plan: FlashPlan): FlashPlanStepStatus[] {
  return plan.steps.map((step) => ({
    partition: step.partition,
    imageFile: step.image_file,
    status: 'idle' as OperationStatus,
    detail: null,
  }))
}

export const useFlasherStore = create<FlasherState & FlasherActions>()(immer((set) => ({
  ...initialState,

  setFastbootDevices: (devices) => set({ fastbootDevices: devices }),
  setActiveFastbootSerial: (serial) => set({ activeFastbootSerial: serial }),
  setDeviceMode: (mode) => set({ deviceMode: mode }),
  setIsUserspace: (isUserspace) => set({ isUserspace }),
  setSelectedPartition: (partition) => set({ selectedPartition: partition }),
  setSelectedImagePath: (path) => set({ selectedImagePath: path }),
  setRomFolderPath: (path) => set({ romFolderPath: path }),

  setFlashPlan: (plan) => {
    if (!plan) {
      set({ flashPlan: null, flashPlanSteps: [], selectedPartitions: [] })
      return
    }
    const steps = createPlanSteps(plan)
    set({
      flashPlan: plan,
      flashPlanSteps: steps,
      selectedPartitions: steps.map((s) => s.partition),
    })
  },

  setFlashPlanStepStatus: (partition, status, detail = null) => {
    set((state) => {
      const step = state.flashPlanSteps.find((s) => s.partition === partition)
      if (step) {
        step.status = status
        step.detail = detail
      }
    })
  },

  togglePartitionSelection: (partition) => {
    set((state) => {
      const idx = state.selectedPartitions.indexOf(partition)
      if (idx >= 0) {
        state.selectedPartitions.splice(idx, 1)
      } else {
        state.selectedPartitions.push(partition)
      }
    })
  },

  selectAllPartitions: () => {
    set((state) => {
      state.selectedPartitions = state.flashPlanSteps.map((s) => s.partition)
    })
  },

  deselectAllPartitions: () => set({ selectedPartitions: [] }),

  setCurrentSlot: (slot) => set({ currentSlot: slot }),
  setCustomCommand: (command) => set({ customCommand: command }),
  setCustomCommandOutput: (output) => set({ customCommandOutput: output }),
  setSideloadFilePath: (path) => set({ sideloadFilePath: path }),
  setLoadingDevices: (loading) => set({ loadingDevices: loading }),
  setRefreshingDevices: (refreshing) => set({ refreshingDevices: refreshing }),
  setScanningPlan: (scanning) => set({ scanningPlan: scanning }),
  setRunningFlash: (running) => set({ runningFlash: running }),
  setRunningBatchFlash: (running) => set({ runningBatchFlash: running }),
  setRunningWipe: (running) => set({ runningWipe: running }),
  setRunningSideload: (running) => set({ runningSideload: running }),
  setRunningSlotChange: (running) => set({ runningSlotChange: running }),
  setRunningCommand: (running) => set({ runningCommand: running }),
  setError: (error) => set({ error }),
  setLastUpdatedAt: (time) => set({ lastUpdatedAt: time }),

  reset: () => set(initialState),
})))
