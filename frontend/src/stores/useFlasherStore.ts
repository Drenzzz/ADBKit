import { create } from 'zustand'
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

export const useFlasherStore = create<FlasherState & FlasherActions>()((set, get) => ({
  ...initialState,

  setFastbootDevices: (devices) => set({ fastbootDevices: devices }),
  setActiveFastbootSerial: (serial) => set({ activeFastbootSerial: serial }),
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
    const { flashPlanSteps } = get()
    const updated = flashPlanSteps.map((step) =>
      step.partition === partition ? { ...step, status, detail } : step,
    )
    set({ flashPlanSteps: updated })
  },

  togglePartitionSelection: (partition) => {
    const { selectedPartitions } = get()
    if (selectedPartitions.includes(partition)) {
      set({ selectedPartitions: selectedPartitions.filter((p) => p !== partition) })
    } else {
      set({ selectedPartitions: [...selectedPartitions, partition] })
    }
  },

  selectAllPartitions: () => {
    const { flashPlanSteps } = get()
    set({ selectedPartitions: flashPlanSteps.map((s) => s.partition) })
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
}))
