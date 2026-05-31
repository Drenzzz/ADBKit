import type { LogcatEntry, LogcatStatusEvent } from '@/lib/types'
import { StartLogcat, StopLogcat, SaveLogcatToFile } from '../../wailsjs/go/main/App'
import { EventsOn } from '../../wailsjs/runtime/runtime'

export const LOGCAT_LINE_EVENT = 'logcat_line'
export const LOGCAT_STATUS_EVENT = 'logcat_status'

export async function startLogcat(
  serial?: string,
  levels?: string,
  tagFilter?: string,
): Promise<void> {
  return StartLogcat(serial ?? '', levels ?? '', tagFilter ?? '')
}

export async function stopLogcat(serial?: string): Promise<void> {
  return StopLogcat(serial ?? '')
}

export async function saveLogcatToFile(
  content: string,
  defaultFilename: string,
): Promise<void> {
  return SaveLogcatToFile(content, defaultFilename)
}

export function onLogcatLine(
  callback: (entry: LogcatEntry) => void,
): () => void {
  return EventsOn(LOGCAT_LINE_EVENT, (entry: LogcatEntry) => {
    callback(entry)
  })
}

export function onLogcatStatus(
  callback: (event: LogcatStatusEvent) => void,
): () => void {
  return EventsOn(LOGCAT_STATUS_EVENT, (event: LogcatStatusEvent) => {
    callback(event)
  })
}
