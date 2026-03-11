"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import "@/styles/global.css";
import { LayoutDashboard, Box, FolderOpen, Terminal, Settings, Activity, TerminalSquare, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

import { ViewDashboard } from "./views/ViewDashboard";
import { ViewAppManager } from "./views/ViewAppManager";
import { ViewFileExplorer } from "./views/ViewFileExplorer";
import { ViewFlasher } from "./views/ViewFlasher";
import { ViewUtilities } from "./views/ViewUtilities";
import { ViewLogcat } from "./views/ViewLogcat";
import { ViewCommandLogs } from "./views/ViewCommandLogs";
import { ViewMonitor } from "./views/ViewMonitor";
import { Toaster } from "@/components/ui/sonner";

import { ThemeProvider } from "./ThemeProvider";
import { ViewShell } from "./views/ViewShell";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { LoadingOverlay } from "@/components/layout/LoadingOverlay";

import { DeviceProvider } from "@/lib/deviceContext";

const VIEWS = {
  DASHBOARD: "dashboard",
  APPS: "apps",
  FILES: "files",
  FLASHER: "flasher",
  UTILS: "utils",
  LOGCAT: "logcat",
  MONITOR: "monitor",
  SHELL: "shell",
  LOGS: "logs",
} as const;

type ViewType = (typeof VIEWS)[keyof typeof VIEWS];

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const LOADING_DURATION = 750;

export type HistoryEntry = {
  type: "command" | "result" | "error";
  text: string;
};

const NAV_ITEMS = [
  { id: VIEWS.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { id: VIEWS.APPS, icon: Box, label: "Application" },
  { id: VIEWS.FILES, icon: FolderOpen, label: "File" },
  { id: VIEWS.FLASHER, icon: Terminal, label: "Flasher" },
  { id: VIEWS.LOGCAT, icon: Activity, label: "Logcat" },
  { id: VIEWS.MONITOR, icon: LineChart, label: "Monitor" },
  { id: VIEWS.UTILS, icon: Settings, label: "Utility" },
  { id: VIEWS.SHELL, icon: Terminal, label: "Terminal" },
  { id: VIEWS.LOGS, icon: TerminalSquare, label: "Audit Logs" },
];

export function MainLayout() {
  const [activeView, setActiveView] = useState<ViewType>(VIEWS.DASHBOARD);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shellHistory, setShellHistory] = useState<HistoryEntry[]>([]);
  const [shellCommandHistory, setShellCommandHistory] = useState<string[]>([]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleSelectView = useCallback((id: string) => {
    setActiveView(id as ViewType);
  }, []);

  const renderedView = useMemo(() => {
    switch (activeView) {
      case VIEWS.DASHBOARD:
        return <ViewDashboard activeView={activeView} />;
      case VIEWS.APPS:
        return <ViewAppManager activeView={activeView} />;
      case VIEWS.FILES:
        return <ViewFileExplorer activeView={activeView} />;
      case VIEWS.FLASHER:
        return <ViewFlasher activeView={activeView} />;
      case VIEWS.UTILS:
        return <ViewUtilities activeView={activeView} />;
      case VIEWS.LOGCAT:
        return <ViewLogcat activeView={activeView} />;
      case VIEWS.MONITOR:
        return <ViewMonitor activeView={activeView} />;
      case VIEWS.SHELL:
        return <ViewShell activeView={activeView} history={shellHistory} setHistory={setShellHistory} commandHistory={shellCommandHistory} setCommandHistory={setShellCommandHistory} />;
      case VIEWS.LOGS:
        return <ViewCommandLogs activeView={activeView} />;
      default:
        return <ViewDashboard activeView={activeView} />;
    }
  }, [activeView, shellHistory, shellCommandHistory]);

  useEffect(() => {
    let animationFrame: number;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }
      const elapsed = timestamp - startTime;
      const nextProgress = Math.min(100, (elapsed / LOADING_DURATION) * 100);
      setProgress(nextProgress);

      if (elapsed < LOADING_DURATION) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        setIsLoading(false);
      }
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DeviceProvider>
        <TooltipProvider delayDuration={0}>
          <LoadingOverlay isLoading={isLoading} progress={progress} />
          <div className={cn("relative flex h-screen bg-background text-foreground overflow-hidden", isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500 ease-in-out")}>
            <AppSidebar navItems={NAV_ITEMS} activeView={activeView} isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} onSelectView={handleSelectView} />

            <main className="flex-1 overflow-auto custom-scroll perf-scroll">
              <div className="min-h-full p-6">
                <AnimatePresence mode="wait">
                  <motion.div key={activeView} initial="hidden" animate="visible" exit="exit" variants={pageVariants} transition={{ duration: 0.2 }}>
                    {renderedView}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </DeviceProvider>
    </ThemeProvider>
  );
}
