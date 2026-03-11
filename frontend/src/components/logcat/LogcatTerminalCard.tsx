import React, { useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Play, Square, Trash2, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LogLine {
  id: string;
  serial: string;
  line: string;
  type: "stdout" | "stderr";
}

interface LogcatTerminalCardProps {
  logs: LogLine[];
  serial: string;
  isRunning: boolean;
  filterText: string;
  autoScroll: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onFilterChange: (text: string) => void;
  onToggleAutoScroll: () => void;
  onExport: () => void;
}

export function LogcatTerminalCard({
  logs,
  serial,
  isRunning,
  filterText,
  autoScroll,
  onStart,
  onStop,
  onClear,
  onFilterChange,
  onToggleAutoScroll,
  onExport
}: LogcatTerminalCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // Priority color parsing for Android Logcat
  // e.g. "D/ActivityManager: ..."
  const getLogColor = (line: string, type: "stdout" | "stderr") => {
    if (type === "stderr") return "text-destructive";
    
    const priorityMatch = line.match(/^([VDIWEF])\//);
    if (!priorityMatch) return "text-foreground";
    
    switch (priorityMatch[1]) {
      case 'V': return "text-muted-foreground"; // Verbose
      case 'D': return "text-blue-400"; // Debug
      case 'I': return "text-green-400"; // Info
      case 'W': return "text-amber-500 font-medium"; // Warn
      case 'E': return "text-destructive font-bold"; // Error
      case 'F': return "text-purple-500 font-bold bg-purple-500/10"; // Fatal
      default: return "text-foreground";
    }
  };

  return (
    <Card className="flex flex-col h-full border-0 rounded-none shadow-none">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-sm font-medium">Live Logcat Output</CardTitle>
          <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 bg-muted rounded">
            {serial ? `Device: ${serial}` : "No device selected"}
          </span>
          <span className={`text-xs ml-2 px-2 py-0.5 rounded flex items-center gap-1 ${isRunning ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
            <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}></span>
            {isRunning ? 'Streaming' : 'Stopped'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex items-center max-w-sm">
            <Filter className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Filter by tag, message..." 
              value={filterText}
              onChange={(e) => onFilterChange(e.target.value)}
              className="h-8 w-48 pl-8 text-xs" 
            />
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={onToggleAutoScroll}>
            {autoScroll ? 'Pause Scroll' : 'Resume Scroll'}
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={onExport} disabled={logs.length === 0}>
            <Download className="mr-2 h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={onClear}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          
          {isRunning ? (
            <Button variant="destructive" size="sm" className="h-8" onClick={onStop}>
              <Square className="mr-2 h-3.5 w-3.5 fill-current" />
              Stop
            </Button>
          ) : (
            <Button variant="default" size="sm" className="h-8" onClick={onStart} disabled={!serial}>
              <Play className="mr-2 h-3.5 w-3.5 fill-current" />
              Start Logcat
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden relative bg-black/5 dark:bg-black/40">
        <ScrollArea className="h-full w-full p-4" ref={scrollRef}>
          <div className="font-mono text-xs whitespace-pre-wrap flex flex-col gap-0.5 select-text">
            {logs.length === 0 ? (
              <div className="text-muted-foreground italic h-full flex items-center justify-center p-8 text-sm">
                {isRunning ? "Waiting for logs..." : "Click 'Start Logcat' to begin streaming log output from device."}
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`${getLogColor(log.line, log.type)} break-all hover:bg-muted/50 px-1 -mx-1 rounded`}>
                  {log.line}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
