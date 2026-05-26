import { create } from 'zustand'
import type { FileEntry, FileSortField, FileSortDirection } from '@/lib/types'

interface FileCacheEntry {
  files: FileEntry[]
  lastUpdatedAt: number
}

interface FileExplorerState {
  currentPath: string
  files: FileEntry[]
  fileCache: Record<string, FileCacheEntry>
  dialogTargetFile: FileEntry | null
  isPullDialogOpen: boolean
  isPushDialogOpen: boolean
  isPushFolderDialogOpen: boolean
  isRenameDialogOpen: boolean
  isDeleteDialogOpen: boolean
  isNewFolderDialogOpen: boolean
  isBatchPullDialogOpen: boolean
  isBatchDeleteDialogOpen: boolean
  searchTerm: string
  showHidden: boolean
  sortField: FileSortField
  sortDirection: FileSortDirection
  selectedFiles: string[]
  loading: boolean
  refreshing: boolean
  busyFilePath: string | null
  busyBatchAction: 'pull' | 'push' | 'delete' | null
  error: string | null
  lastUpdatedAt: number | null
}

interface FileExplorerActions {
  setCurrentPath: (path: string) => void
  setFiles: (files: FileEntry[]) => void
  setCachedFiles: (cacheKey: string, files: FileEntry[], lastUpdatedAt: number) => void
  updateFileSize: (filePath: string, sizeHuman: string, cacheKey?: string) => void
  setDialogTargetFile: (file: FileEntry | null) => void
  setIsPullDialogOpen: (open: boolean) => void
  setIsPushDialogOpen: (open: boolean) => void
  setIsPushFolderDialogOpen: (open: boolean) => void
  setIsRenameDialogOpen: (open: boolean) => void
  setIsDeleteDialogOpen: (open: boolean) => void
  setIsNewFolderDialogOpen: (open: boolean) => void
  setIsBatchPullDialogOpen: (open: boolean) => void
  setIsBatchDeleteDialogOpen: (open: boolean) => void
  setSearchTerm: (term: string) => void
  setShowHidden: (show: boolean) => void
  setSortField: (field: FileSortField) => void
  setSortDirection: (dir: FileSortDirection) => void
  setSelectedFiles: (files: string[]) => void
  toggleFileSelection: (filePath: string) => void
  toggleVisibleSelection: (filePaths: string[]) => void
  clearSelection: () => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setBusyFilePath: (path: string | null) => void
  setBusyBatchAction: (action: 'pull' | 'push' | 'delete' | null) => void
  setError: (error: string | null) => void
  setLastUpdatedAt: (timestamp: number | null) => void
  resetFilters: () => void
  reset: () => void
}

type FileExplorerStore = FileExplorerState & FileExplorerActions

const initialState: FileExplorerState = {
  currentPath: '/sdcard',
  files: [],
  fileCache: {},
  dialogTargetFile: null,
  isPullDialogOpen: false,
  isPushDialogOpen: false,
  isPushFolderDialogOpen: false,
  isRenameDialogOpen: false,
  isDeleteDialogOpen: false,
  isNewFolderDialogOpen: false,
  isBatchPullDialogOpen: false,
  isBatchDeleteDialogOpen: false,
  searchTerm: '',
  showHidden: false,
  sortField: 'name',
  sortDirection: 'asc',
  selectedFiles: [],
  loading: false,
  refreshing: false,
  busyFilePath: null,
  busyBatchAction: null,
  error: null,
  lastUpdatedAt: null,
}

export const useFileExplorerStore = create<FileExplorerStore>()((set) => ({
  ...initialState,

  setCurrentPath: (currentPath) => set({ currentPath, selectedFiles: [] }),
  setFiles: (files) => set({ files }),
  setCachedFiles: (cacheKey, files, lastUpdatedAt) =>
    set((state) => ({
      fileCache: {
        ...state.fileCache,
        [cacheKey]: { files, lastUpdatedAt },
      },
    })),
  updateFileSize: (filePath, sizeHuman, cacheKey) =>
    set((state) => {
      const updateEntry = (file: FileEntry) =>
        file.path === filePath ? { ...file, sizeHuman } : file

      const fileCache = cacheKey
        ? {
            ...state.fileCache,
            [cacheKey]: state.fileCache[cacheKey]
              ? {
                  ...state.fileCache[cacheKey],
                  files: state.fileCache[cacheKey].files.map(updateEntry),
                }
              : {
                  files: state.files.map(updateEntry),
                  lastUpdatedAt: Date.now(),
                },
          }
        : state.fileCache

      return {
        files: state.files.map(updateEntry),
        fileCache,
      }
    }),
  setDialogTargetFile: (dialogTargetFile) => set({ dialogTargetFile }),
  setIsPullDialogOpen: (isPullDialogOpen) => set({ isPullDialogOpen }),
  setIsPushDialogOpen: (isPushDialogOpen) => set({ isPushDialogOpen }),
  setIsPushFolderDialogOpen: (isPushFolderDialogOpen) => set({ isPushFolderDialogOpen }),
  setIsRenameDialogOpen: (isRenameDialogOpen) => set({ isRenameDialogOpen }),
  setIsDeleteDialogOpen: (isDeleteDialogOpen) => set({ isDeleteDialogOpen }),
  setIsNewFolderDialogOpen: (isNewFolderDialogOpen) => set({ isNewFolderDialogOpen }),
  setIsBatchPullDialogOpen: (isBatchPullDialogOpen) => set({ isBatchPullDialogOpen }),
  setIsBatchDeleteDialogOpen: (isBatchDeleteDialogOpen) => set({ isBatchDeleteDialogOpen }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setShowHidden: (showHidden) => set({ showHidden }),
  setSortField: (sortField) => set({ sortField }),
  setSortDirection: (sortDirection) => set({ sortDirection }),
  setSelectedFiles: (selectedFiles) => set({ selectedFiles }),
  toggleFileSelection: (filePath) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.includes(filePath)
        ? state.selectedFiles.filter((p) => p !== filePath)
        : [...state.selectedFiles, filePath],
    })),
  toggleVisibleSelection: (filePaths) =>
    set((state) => {
      const visiblePaths = filePaths.filter((p) => p !== '')
      const allSelected =
        visiblePaths.length > 0 &&
        visiblePaths.every((p) => state.selectedFiles.includes(p))

      if (allSelected) {
        return {
          selectedFiles: state.selectedFiles.filter((p) => !visiblePaths.includes(p)),
        }
      }

      return {
        selectedFiles: Array.from(new Set([...state.selectedFiles, ...visiblePaths])),
      }
    }),
  clearSelection: () => set({ selectedFiles: [] }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setBusyFilePath: (busyFilePath) => set({ busyFilePath }),
  setBusyBatchAction: (busyBatchAction) => set({ busyBatchAction }),
  setError: (error) => set({ error }),
  setLastUpdatedAt: (lastUpdatedAt) => set({ lastUpdatedAt }),
  resetFilters: () =>
    set({
      searchTerm: initialState.searchTerm,
      showHidden: initialState.showHidden,
      sortField: initialState.sortField,
      sortDirection: initialState.sortDirection,
      selectedFiles: [],
    }),
  reset: () => set(initialState),
}))
