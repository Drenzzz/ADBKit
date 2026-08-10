import type {
  TerminalClosedEvent,
  TerminalMode,
  TerminalOutputEvent,
  TerminalSession,
} from '@/lib/types'
import {
  StartTerminalSession,
  SendTerminalInput,
  CloseTerminal,
} from '../../bindings/ADBKit/app'
import { Events } from '@wailsio/runtime'

export const TERMINAL_OUTPUT_EVENT = 'terminal_output'
export const TERMINAL_CLOSED_EVENT = 'terminal_closed'

export async function startTerminalSession(
  mode: TerminalMode,
  serial?: string,
  initialArgs = '',
): Promise<TerminalSession> {
  return (await StartTerminalSession(
    mode,
    serial ?? '',
    initialArgs,
  )) as unknown as TerminalSession
}

export async function sendTerminalInput(
  sessionId: string,
  input: string,
): Promise<void> {
  return SendTerminalInput(sessionId, input)
}

export async function closeTerminal(sessionId: string): Promise<void> {
  return CloseTerminal(sessionId)
}

export function onTerminalOutput(
  callback: (event: TerminalOutputEvent) => void,
): () => void {
  return Events.On(TERMINAL_OUTPUT_EVENT, (event) => {
    callback(event.data as TerminalOutputEvent)
  })
}

export function onTerminalClosed(
  callback: (event: TerminalClosedEvent) => void,
): () => void {
  return Events.On(TERMINAL_CLOSED_EVENT, (event) => {
    callback(event.data as TerminalClosedEvent)
  })
}
