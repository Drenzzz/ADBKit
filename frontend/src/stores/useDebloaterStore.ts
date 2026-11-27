import { create } from 'zustand'
import type {
  AppsViewMode,
  DebloatCatalogMeta,
  DebloatRiskFilter,
  DebloatScanResult,
  DebloatTypeFilter,
  DebloatVendorFilter,
  RestorablePackage,
} from '@/lib/types'

interface DebloaterState {
  activeMode: AppsViewMode
  scanResult: DebloatScanResult | null
  restorablePackages: RestorablePackage[]
  catalogMeta: DebloatCatalogMeta | null

  searchTerm: string
  vendorFilter: DebloatVendorFilter
  riskFilter: DebloatRiskFilter
  typeFilter: DebloatTypeFilter

  restoreSearchTerm: string
  restoreCatalogOnly: boolean

  selectedDebloat: string[]
  selectedRestore: string[]

  scanning: boolean
  loadingRestorable: boolean
  executingAction: 'debloat' | 'disable' | 'restore' | null
  busyRestorePackage: string | null
  error: string | null
}

interface DebloaterActions {
  setActiveMode: (mode: AppsViewMode) => void
  setScanResult: (result: DebloatScanResult | null) => void
  setRestorablePackages: (packages: RestorablePackage[]) => void
  setCatalogMeta: (meta: DebloatCatalogMeta | null) => void

  setSearchTerm: (term: string) => void
  setVendorFilter: (vendor: DebloatVendorFilter) => void
  setRiskFilter: (risk: DebloatRiskFilter) => void
  setTypeFilter: (type: DebloatTypeFilter) => void

  setRestoreSearchTerm: (term: string) => void
  setRestoreCatalogOnly: (catalogOnly: boolean) => void

  setSelectedDebloat: (names: string[]) => void
  toggleDebloatSelect: (name: string) => void
  toggleAllDebloat: (visibleNames: string[]) => void
  clearDebloatSelection: () => void

  setSelectedRestore: (names: string[]) => void
  toggleRestoreSelect: (name: string) => void
  toggleAllRestore: (visibleNames: string[]) => void
  clearRestoreSelection: () => void

  setScanning: (scanning: boolean) => void
  setLoadingRestorable: (loading: boolean) => void
  setExecutingAction: (action: 'debloat' | 'disable' | 'restore' | null) => void
  setBusyRestorePackage: (pkg: string | null) => void
  setError: (error: string | null) => void
  resetForDeviceChange: () => void
}

type DebloaterStore = DebloaterState & DebloaterActions

const initialState: DebloaterState = {
  activeMode: 'packages',
  scanResult: null,
  restorablePackages: [],
  catalogMeta: null,
  searchTerm: '',
  vendorFilter: 'all',
  riskFilter: 'all',
  typeFilter: 'all',
  restoreSearchTerm: '',
  restoreCatalogOnly: false,
  selectedDebloat: [],
  selectedRestore: [],
  scanning: false,
  loadingRestorable: false,
  executingAction: null,
  busyRestorePackage: null,
  error: null,
}

export const useDebloaterStore = create<DebloaterStore>()((set) => ({
  ...initialState,

  setActiveMode: (activeMode) => set({ activeMode, error: null }),
  setScanResult: (scanResult) => set({ scanResult }),
  setRestorablePackages: (restorablePackages) => set({ restorablePackages }),
  setCatalogMeta: (catalogMeta) => set({ catalogMeta }),

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setVendorFilter: (vendorFilter) => set({ vendorFilter }),
  setRiskFilter: (riskFilter) => set({ riskFilter }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),

  setRestoreSearchTerm: (restoreSearchTerm) => set({ restoreSearchTerm }),
  setRestoreCatalogOnly: (restoreCatalogOnly) => set({ restoreCatalogOnly }),

  setSelectedDebloat: (selectedDebloat) => set({ selectedDebloat }),
  toggleDebloatSelect: (name) =>
    set((state) => ({
      selectedDebloat: state.selectedDebloat.includes(name)
        ? state.selectedDebloat.filter((p) => p !== name)
        : [...state.selectedDebloat, name],
    })),
  toggleAllDebloat: (visibleNames) =>
    set((state) => {
      const allSelected =
        visibleNames.length > 0 &&
        visibleNames.every((name) => state.selectedDebloat.includes(name))
      if (allSelected) {
        return {
          selectedDebloat: state.selectedDebloat.filter(
            (name) => !visibleNames.includes(name),
          ),
        }
      }
      return {
        selectedDebloat: Array.from(
          new Set([...state.selectedDebloat, ...visibleNames]),
        ),
      }
    }),
  clearDebloatSelection: () => set({ selectedDebloat: [] }),

  setSelectedRestore: (selectedRestore) => set({ selectedRestore }),
  toggleRestoreSelect: (name) =>
    set((state) => ({
      selectedRestore: state.selectedRestore.includes(name)
        ? state.selectedRestore.filter((p) => p !== name)
        : [...state.selectedRestore, name],
    })),
  toggleAllRestore: (visibleNames) =>
    set((state) => {
      const allSelected =
        visibleNames.length > 0 &&
        visibleNames.every((name) => state.selectedRestore.includes(name))
      if (allSelected) {
        return {
          selectedRestore: state.selectedRestore.filter(
            (name) => !visibleNames.includes(name),
          ),
        }
      }
      return {
        selectedRestore: Array.from(
          new Set([...state.selectedRestore, ...visibleNames]),
        ),
      }
    }),
  clearRestoreSelection: () => set({ selectedRestore: [] }),

  setScanning: (scanning) => set({ scanning }),
  setLoadingRestorable: (loadingRestorable) => set({ loadingRestorable }),
  setExecutingAction: (executingAction) => set({ executingAction }),
  setBusyRestorePackage: (busyRestorePackage) => set({ busyRestorePackage }),
  setError: (error) => set({ error }),
  resetForDeviceChange: () =>
    set({
      scanResult: null,
      restorablePackages: [],
      selectedDebloat: [],
      selectedRestore: [],
      error: null,
    }),
}))
