import React, { useState, useEffect, useCallback } from "react";
import { GetCommandHistory } from "../../../wailsjs/go/backend/App";
import { backend } from "../../../wailsjs/go/models";
import { CommandLogTable } from "@/components/logs/CommandLogTable";
import { toast } from "sonner";
import { TerminalSquare } from "lucide-react";

export function ViewCommandLogs({ activeView }: { activeView: string }) {
  const [logs, setLogs] = useState<backend.CommandLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch up to 500 recent commands without filtering by serial
      const history = await GetCommandHistory("", 500);
      setLogs(history || []);
    } catch (error) {
      console.error("Failed to fetch command history:", error);
      toast.error("Failed to load command logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch logs when entering the view
  useEffect(() => {
    if (activeView === "logs") {
      fetchLogs();
    }
  }, [activeView, fetchLogs]);

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] gap-4">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TerminalSquare className="h-6 w-6" />
          Internal Command Logs
        </h2>
        <p className="text-muted-foreground">
          Audit history of all adb and fastboot host commands executed by ADB-Kit.
        </p>
      </div>
      <CommandLogTable logs={logs} onRefresh={fetchLogs} isLoading={isLoading} />
    </div>
  );
}
