import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, MemoryStick, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { backend } from "../../../wailsjs/go/models";

interface PerformanceCardsProps {
  snapshot: backend.PerformanceSnapshot | null;
  historySize: number;
}

export function PerformanceCards({ snapshot }: PerformanceCardsProps) {
  const cpu = snapshot?.cpuUsage || 0;
  const ram = snapshot?.ramUsage || 0;
  const rx = snapshot?.networkRxSec || 0; // Bytes per sec
  const tx = snapshot?.networkTxSec || 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cpu.toFixed(1)}%</div>
          <div className="w-full bg-secondary h-2 mt-3 rounded-full overflow-hidden">
            <div 
              className={`h-full ${cpu > 80 ? 'bg-destructive' : cpu > 50 ? 'bg-amber-500' : 'bg-green-500'} transition-all duration-500`} 
              style={{ width: `${Math.min(100, Math.max(0, cpu))}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">RAM Usage</CardTitle>
          <MemoryStick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ram.toFixed(1)}%</div>
          <div className="w-full bg-secondary h-2 mt-3 rounded-full overflow-hidden">
            <div 
              className={`h-full ${ram > 85 ? 'bg-destructive' : ram > 65 ? 'bg-amber-500' : 'bg-blue-500'} transition-all duration-500`} 
              style={{ width: `${Math.min(100, Math.max(0, ram))}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-blue-500">
              <ArrowDownToLine className="h-4 w-4" />
              <span>{formatBytes(rx)}</span>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <ArrowUpFromLine className="h-4 w-4" />
              <span>{formatBytes(tx)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
