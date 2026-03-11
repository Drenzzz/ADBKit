import React, { useState, useEffect, useRef } from "react";
import { GetPerformanceSnapshot } from "../../../wailsjs/go/backend/App";
import { backend } from "../../../wailsjs/go/models";
import { useDevice } from "@/lib/deviceContext";
import { PerformanceCards } from "@/components/monitor/PerformanceCards";
import { Activity } from "lucide-react";

export function ViewMonitor({ activeView }: { activeView: string }) {
  const { activeSerial } = useDevice();
  const [snapshot, setSnapshot] = useState<backend.PerformanceSnapshot | null>(null);
  
  // To calculate network delta
  const lastRxBytes = useRef<number>(0);
  const lastTxBytes = useRef<number>(0);
  const lastTime = useRef<number>(Date.now());

  useEffect(() => {
    let interval: number;

    const fetchStats = async () => {
      if (!activeSerial) return;
      try {
        const rawSnap = await GetPerformanceSnapshot(activeSerial);
        const now = Date.now();
        const timeDiff = (now - lastTime.current) / 1000; // seconds

        let rxSpeed = 0;
        let txSpeed = 0;

        if (lastTime.current > 0 && timeDiff > 0) {
          // If the device rebooted, bytes might reset to 0, causing negative speed. Guard against it.
          if (rawSnap.networkRxSec >= lastRxBytes.current) {
            rxSpeed = (rawSnap.networkRxSec - lastRxBytes.current) / timeDiff;
          }
          if (rawSnap.networkTxSec >= lastTxBytes.current) {
            txSpeed = (rawSnap.networkTxSec - lastTxBytes.current) / timeDiff;
          }
        }

        lastRxBytes.current = rawSnap.networkRxSec;
        lastTxBytes.current = rawSnap.networkTxSec;
        lastTime.current = now;

        setSnapshot({
          ...rawSnap,
          networkRxSec: rxSpeed,
          networkTxSec: txSpeed
        });

      } catch (e) {
        console.error("Monitor fetch error:", e);
      }
    };

    if (activeView === "monitor" && activeSerial) {
      // initial fetch
      fetchStats();
      // poll every 2 seconds
      interval = window.setInterval(fetchStats, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeView, activeSerial]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Performance Monitor
        </h2>
        <p className="text-muted-foreground">
          Real-time diagnostics for device CPU, Memory, and Network usage.
        </p>
      </div>

      {!activeSerial ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
          No active device selected. Please select a device from the Dashboard.
        </div>
      ) : (
        <PerformanceCards snapshot={snapshot} historySize={30} />
      )}
    </div>
  );
}
