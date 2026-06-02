import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFlasher } from '@/hooks/useFlasher'
import { useFlasherStore } from '@/stores/useFlasherStore'
import { Terminal, Play } from 'lucide-react'

const MAX_HISTORY_ENTRIES = 30
const MAX_LINES_PER_OUTPUT = 25

interface HistoryEntry {
  command: string
  output: string
}

function truncateLines(text: string, maxLines: number): string {
  const lines = text.split('\n')
  if (lines.length <= maxLines) return text
  return lines.slice(-maxLines).join('\n')
}

export function TerminalCard() {
  const {
    activeFastbootSerial,
    customCommand,
    setCustomCommand,
    runningCommand,
    setCustomCommandOutput,
    executeCustomCommand,
  } = useFlasher()

  const [history, setHistory] = useState<HistoryEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const hasDevice = !!activeFastbootSerial

  async function handleSubmit() {
    const cmd = customCommand.trim()
    if (!cmd || runningCommand) return

    setCustomCommand('')
    await executeCustomCommand()

    const output = useFlasherStore.getState().customCommandOutput
    const newEntry: HistoryEntry = {
      command: cmd,
      output: truncateLines(output, MAX_LINES_PER_OUTPUT),
    }
    setHistory((prev) => {
      const next = [...prev, newEntry]
      return next.length > MAX_HISTORY_ENTRIES ? next.slice(-MAX_HISTORY_ENTRIES) : next
    })
    setCustomCommandOutput('')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="h-4 w-4" />
          Fastboot Terminal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-[180px]">
          <div ref={scrollRef} className="space-y-2 p-2 font-mono text-xs">
            {history.length === 0 && (
              <p className="text-muted-foreground">No commands yet. Enter a fastboot command below.</p>
            )}
            {history.map((entry, i) => (
              <div key={i} className="space-y-1">
                <div className="text-foreground">$ {entry.command}</div>
                {entry.output && (
                  <pre className="whitespace-pre-wrap text-muted-foreground">{entry.output}</pre>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="e.g. getvar all"
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={!hasDevice || runningCommand}
            className="h-8 font-mono text-xs"
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSubmit}
            disabled={!hasDevice || !customCommand.trim() || runningCommand}
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
