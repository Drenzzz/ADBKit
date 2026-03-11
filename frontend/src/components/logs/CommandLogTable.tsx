import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Terminal, CheckCircle2, XCircle, AlertCircle, RefreshCw, Search } from "lucide-react";
import { backend } from "../../../wailsjs/go/models";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface CommandLogTableProps {
  logs: backend.CommandLogEntry[];
  onRefresh: () => void;
  isLoading: boolean;
}

export function CommandLogTable({ logs, onRefresh, isLoading }: CommandLogTableProps) {
  const [filter, setFilter] = useState("");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OK": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "FAILED": return <XCircle className="h-4 w-4 text-destructive" />;
      case "TIMEOUT": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "CANCELLED": return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <Terminal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!filter) return true;
    const lowerFilter = filter.toLowerCase();
    return (
      (log.command || "").toLowerCase().includes(lowerFilter) ||
      (log.outputPreview || "").toLowerCase().includes(lowerFilter) ||
      (log.serial || "").toLowerCase().includes(lowerFilter) ||
      (log.status || "").toLowerCase().includes(lowerFilter)
    );
  });

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter logs by command, serial, or status..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="rounded-md border flex-1 overflow-hidden flex flex-col bg-card">
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-muted z-10">
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead className="w-[80px]">Mode</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="min-w-[200px]">Command</TableHead>
                <TableHead className="min-w-[200px]">Output Preview</TableHead>
                <TableHead className="w-[80px]">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No command logs found. Start executing commands to see history.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.timestamp);
                  const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                  
                  return (
                    <TableRow key={log.id} className="group cursor-default">
                      <TableCell className="font-mono text-xs text-muted-foreground">{timeString}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${log.mode === 'adb' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {log.mode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium text-xs">
                          {getStatusIcon(log.status)}
                          <span>{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs break-all relative">
                        {log.command}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80" 
                          onClick={(e) => { e.stopPropagation(); handleCopy(log.command); }}
                          title="Copy command"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate" title={log.outputPreview}>
                        {log.outputPreview || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground text-right">
                        {log.durationMs}ms
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
