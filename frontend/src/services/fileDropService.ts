import { Events } from '@wailsio/runtime'

export const FILE_DROP_EVENT = 'files-dropped'

export function onFileDrop(
  callback: (paths: string[]) => void,
): () => void {
  return Events.On(FILE_DROP_EVENT, (event) => {
    callback(event.data)
  })
}
