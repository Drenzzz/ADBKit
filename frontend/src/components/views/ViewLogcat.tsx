import React, { useState, useEffect, useCallback, useMemo } from "react";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import { StartLogcat, StopLogcat } from "../../../wailsjs/go/backend/App";
import { LogcatTerminalCard } from "@/components/logcat/LogcatTerminalCard";
import { toast } from "sonner";
import { useDevice } from "@/lib/deviceContext";

// Use a global buffer to prevent overwhelming React state if lines come too fast
let logBuffer: { id: string, serial: string, line: string, type: "stdout" | "stderr" }[] = [];
let bufferTimer: number | null = null;
let lineCounter = 0;

export function ViewLogcat({ activeView }: { activeView: string }) {
  const { activeSerial } = useDevice();
  const selectedSerial = activeSerial ?? "";
  const [logs, setLogs] = useState<{ id: string, serial: string, line: string, type: "stdout" | "stderr" }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  const handleLogLine = useCallback((data: { serial: string, line: string }, type: "stdout" | "stderr") => {
    logBuffer.push({
      id: `log-${Date.now()}-${lineCounter++}`,
      serial: data.serial,
      line: data.line,
      type
    });
    
    // Maintain max buffer size (e.g. 5000 lines) to prevent memory leak
    if (logBuffer.length > 5000) {
      logBuffer = logBuffer.slice(-5000);
    }

    if (!bufferTimer) {
      bufferTimer = window.setTimeout(() => {
        setLogs([...logBuffer]);
        bufferTimer = null;
      }, 100); // Flush buffer every 100ms
    }
  }, []);

  useEffect(() => {
    // Only subscribe to events if we are on the logcat view
    if (activeView !== "logcat") {
      // Auto-stop logcat if navigating away to save resources
      if (isRunning && selectedSerial) {
        handleStopLogcat();
      }
      return;
    }

    // Subscribe to Wails runtime events
    const stdoutCancel = EventsOn("logcat_line", (data) => handleLogLine(data, "stdout"));
    const stderrCancel = EventsOn("logcat_error", (data) => handleLogLine(data, "stderr"));
    const statusCancel = EventsOn("logcat_status", (data) => {
      if (data.serial === selectedSerial) {
        setIsRunning(false);
        if (data.status === "error") {
          toast.error("Logcat stream stopped unexpectedly.");
        }
      }
    });

    return () => {
      stdoutCancel();
      stderrCancel();
      statusCancel();
      if (bufferTimer) {
        clearTimeout(bufferTimer);
        bufferTimer = null;
      }
    };
  }, [activeView, selectedSerial, handleLogLine, isRunning]);

  const handleStartLogcat = async () => {
    if (!selectedSerial) {
      toast.error("No active device selected.");
      return;
    }

    try {
      await StartLogcat(selectedSerial, ""); // Could pass predefined filters if we add UI for it later
      setIsRunning(true);
      toast.success("Logcat started.");
    } catch (error) {
      toast.error("Failed to start logcat", { description: String(error) });
      setIsRunning(false);
    }
  };

  const handleStopLogcat = async () => {
    if (!selectedSerial) return;
    
    try {
      await StopLogcat(selectedSerial);
      setIsRunning(false);
    } catch (error) {
      console.error("Failed to stop logcat", error);
      // Even if backend fails (maybe already stopped), update UI state
      setIsRunning(false);
    }
  };

  const handleClearLogs = () => {
    logBuffer = [];
    setLogs([]);
  };

  const handleExport = () => {
    const text = logs.map(l => l.line).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logcat_${selectedSerial}_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log exported to downloads.");
  };

  const filteredLogs = useMemo(() => {
    if (!filterText) return logs;
    const lowerFilter = filterText.toLowerCase();
    return logs.filter(log => log.line.toLowerCase().includes(lowerFilter));
  }, [logs, filterText]);

  return (
    <div className="h-[calc(100vh-4.5rem)] -m-6 flex flex-col">
      <LogcatTerminalCard 
        logs={filteredLogs}
        serial={selectedSerial}
        isRunning={isRunning}
        filterText={filterText}
        autoScroll={autoScroll}
        onStart={handleStartLogcat}
        onStop={handleStopLogcat}
        onClear={handleClearLogs}
        onFilterChange={setFilterText}
        onToggleAutoScroll={() => setAutoScroll(prev => !prev)}
        onExport={handleExport}
      />
    </div>
  );
}
