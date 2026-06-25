import { create } from 'zustand'
import type {
  PackageBatchAction,
  PackageFilter,
  PackageInfo,
  PackageSortOrder,
  PackageStatusFilter,
} from '@/lib/types'

interface AppManagerState {
  packages: PackageInfo[]
  filter: PackageFilter
  statusFilter: PackageStatusFilter
  sortOrder: PackageSortOrder
  searchTerm: string
  selectedPackages: string[]
  loading: boolean
  refreshing: boolean
  installing: boolean
  busyPackageName: string | null
  busyBatchAction: PackageBatchAction | null
  error: string | null
  lastUpdatedAt: number | null
}

interface AppManagerActions {
  setPackages: (packages: PackageInfo[]) => void
  setFilter: (filter: PackageFilter) => void
  setStatusFilter: (statusFilter: PackageStatusFilter) => void
  setSortOrder: (sortOrder: PackageSortOrder) => void
  setSearchTerm: (searchTerm: string) => void
  setSelectedPackages: (selectedPackages: string[]) => void
  togglePackageSelection: (packageName: string) => void
  toggleVisibleSelection: (packageNames: string[]) => void
  clearSelection: () => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setInstalling: (installing: boolean) => void
  setBusyPackageName: (packageName: string | null) => void
  setBusyBatchAction: (action: PackageBatchAction | null) => void
  setError: (error: string | null) => void
  setLastUpdatedAt: (timestamp: number | null) => void
  resetFilters: () => void
  reset: () => void
}

type AppManagerStore = AppManagerState & AppManagerActions

const initialState: AppManagerState = {
  packages: [],
  filter: 'user',
  statusFilter: 'all',
  sortOrder: 'az',
  searchTerm: '',
  selectedPackages: [],
  loading: false,
  refreshing: false,
  installing: false,
  busyPackageName: null,
  busyBatchAction: null,
  error: null,
  lastUpdatedAt: null,
}

export const useAppManagerStore = create<AppManagerStore>()((set) => ({
  ...initialState,

  setPackages: (packages) => set({ packages }),
  setFilter: (filter) => set({ filter, selectedPackages: [] }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedPackages: (selectedPackages) => set({ selectedPackages }),
  togglePackageSelection: (packageName) =>
    set((state) => {
      const selectedPackages = state.selectedPackages.includes(packageName)
        ? state.selectedPackages.filter((name) => name !== packageName)
        : [...state.selectedPackages, packageName]
      return { selectedPackages }
    }),
  toggleVisibleSelection: (packageNames) =>
    set((state) => {
      const visibleNames = packageNames.filter((name) => name !== '')
      const allSelected =
        visibleNames.length > 0 &&
        visibleNames.every((name) => state.selectedPackages.includes(name))

      if (allSelected) {
        return {
          selectedPackages: state.selectedPackages.filter(
            (name) => !visibleNames.includes(name),
          ),
        }
      }

      return {
        selectedPackages: Array.from(
          new Set([...state.selectedPackages, ...visibleNames]),
        ),
      }
    }),
  clearSelection: () => set({ selectedPackages: [] }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setInstalling: (installing) => set({ installing }),
  setBusyPackageName: (busyPackageName) => set({ busyPackageName }),
  setBusyBatchAction: (busyBatchAction) => set({ busyBatchAction }),
  setError: (error) => set({ error }),
  setLastUpdatedAt: (lastUpdatedAt) => set({ lastUpdatedAt }),
  resetFilters: () =>
    set({
      filter: initialState.filter,
      statusFilter: initialState.statusFilter,
      sortOrder: initialState.sortOrder,
      searchTerm: initialState.searchTerm,
      selectedPackages: [],
    }),
  reset: () => set(initialState),
}))
