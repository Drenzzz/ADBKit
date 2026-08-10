import type {
  ScrcpyEncoderSupport,
  ScrcpyOptions,
  ScrcpySession,
  ScrcpySessionEvent,
} from '@/lib/types'
import {
  StartScrcpySession,
  StopScrcpySession,
  GetActiveScrcpySession,
  StartScrcpyRecording,
  StopScrcpyRecording,
  TakeScrcpyScreenshot,
  GetScrcpyEncoderSupport,
  PushScrcpyClipboard,
  GetScrcpyClipboard,
  SelectSavePath,
  UpdateScrcpyOptions,
} from '../../bindings/ADBKit/app'
import { Events } from '@wailsio/runtime'

export const SCRCPY_SESSION_STARTED_EVENT = 'scrcpy_session_started'
export const SCRCPY_SESSION_STOPPED_EVENT = 'scrcpy_session_stopped'
export const SCRCPY_ERROR_EVENT = 'scrcpy_error'

export async function startScrcpySession(
  serial: string,
  options: ScrcpyOptions,
): Promise<ScrcpySession> {
  const raw = await StartScrcpySession(serial, options as never)
  return raw as unknown as ScrcpySession
}

export async function stopScrcpySession(sessionId: string): Promise<void> {
  await StopScrcpySession(sessionId)
}

export async function getActiveScrcpySession(): Promise<ScrcpySession | null> {
  const raw = await GetActiveScrcpySession()
  return (raw as unknown as ScrcpySession | null) ?? null
}

export async function getScrcpyEncoderSupport(
  serial: string,
): Promise<ScrcpyEncoderSupport> {
  const raw = await GetScrcpyEncoderSupport(serial)
  return raw as unknown as ScrcpyEncoderSupport
}

export async function startScrcpyRecording(
  serial: string,
  outputPath: string,
  options: ScrcpyOptions,
): Promise<void> {
  await StartScrcpyRecording(serial, outputPath, options as never)
}

export async function stopScrcpyRecording(): Promise<string> {
  return StopScrcpyRecording()
}

export async function selectScrcpySaveFile(
  defaultFilename: string,
): Promise<string> {
  return SelectSavePath(defaultFilename)
}

export async function takeScrcpyScreenshot(
  sessionId: string,
  outputPath: string,
): Promise<string> {
  return TakeScrcpyScreenshot(sessionId, outputPath)
}

export async function pushScrcpyClipboard(
  serial: string,
  text: string,
): Promise<void> {
  await PushScrcpyClipboard(serial, text)
}

export async function getScrcpyClipboard(serial: string): Promise<string> {
  return GetScrcpyClipboard(serial)
}

export async function updateScrcpyOptions(options: ScrcpyOptions): Promise<void> {
  await UpdateScrcpyOptions(options as never)
}

export function onScrcpySessionStarted(
  callback: (event: ScrcpySessionEvent) => void,
): () => void {
  return Events.On(
    SCRCPY_SESSION_STARTED_EVENT,
    (event) => {
      callback(event.data)
    },
  )
}

export function onScrcpySessionStopped(
  callback: (event: ScrcpySessionEvent) => void,
): () => void {
  return Events.On(
    SCRCPY_SESSION_STOPPED_EVENT,
    (event) => {
      callback(event.data)
    },
  )
}

export function onScrcpyError(
  callback: (event: ScrcpySessionEvent) => void,
): () => void {
  return Events.On(SCRCPY_ERROR_EVENT, (event) => {
    callback(event.data)
  })
}
