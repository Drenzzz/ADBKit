import {
  OnFileDrop,
  OnFileDropOff,
  CanResolveFilePaths,
  ResolveFilePaths,
} from '../../wailsjs/runtime/runtime'

export function onFileDrop(
  callback: (paths: string[]) => void,
  useDropTarget = true,
): () => void {
  OnFileDrop((_x, _y, paths) => {
    callback(paths)
  }, useDropTarget)

  return () => OnFileDropOff()
}

export function canResolveFilePaths(): boolean {
  return CanResolveFilePaths()
}

export function resolveFilePaths(files: File[]): void {
  ResolveFilePaths(files)
}
