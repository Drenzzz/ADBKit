import React, { useState, useEffect, useCallback, useRef } from "react";
import { WipeData, FlashPartition, SelectImageFile, GetFastbootDevices, SelectZipFile, SideloadPackage, FlashRomFolder, GetFastbootSlot, SetFastbootSlot, ScanRomFolder } from "../../../wailsjs/go/backend/App";
import { backend } from "../../../wailsjs/go/models";

import { toast } from "sonner";
import { useDevice } from "@/lib/deviceContext";
import { FastbootDevicesCard } from "@/components/flasher/FastbootDevicesCard";
import { FlashPartitionCard } from "@/components/flasher/FlashPartitionCard";
import { RecoveryActionsCard } from "@/components/flasher/RecoveryActionsCard";
import { FlashRomFolderCard } from "@/components/flasher/FlashRomFolderCard";
import { SlotManagerCard } from "@/components/flasher/SlotManagerCard";

type Device = backend.Device;

const sanitizeFastbootDevices = (devices: Device[] | null | undefined): Device[] => {
  if (!Array.isArray(devices)) {
    return [];
  }

  return devices
    .filter((device): device is Device => !!device && typeof device.Serial === "string")
    .map((device) => ({
      Serial: device.Serial,
      Status: device.Status ?? "fastboot",
    }));
};

const areDeviceListsEqual = (a: Device[], b: Device[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i].Serial !== b[i].Serial || a[i].Status !== b[i].Status) {
      return false;
    }
  }

  return true;
};

export function ViewFlasher({ activeView }: { activeView: string }) {
  const { activeSerial } = useDevice();
  const [partition, setPartition] = useState("");
  const [filePath, setFilePath] = useState("");
  const [sideloadFilePath, setSideloadFilePath] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [isSideloading, setIsSideloading] = useState(false);

  // Batch Flasher states
  const [romFolderPath, setRomFolderPath] = useState("");
  const [flashPlan, setFlashPlan] = useState<backend.FlashPlan | null>(null);
  const [isScanningFolder, setIsScanningFolder] = useState(false);
  const [isBatchFlashing, setIsBatchFlashing] = useState(false);

  // A/B Slot states
  const [currentSlot, setCurrentSlot] = useState<string | null>(null);
  const [isChangingSlot, setIsChangingSlot] = useState(false);

  const [fastbootDevices, setFastbootDevices] = useState<Device[]>([]);
  const [isRefreshingFastboot, setIsRefreshingFastboot] = useState(false);
  const [fastbootError, setFastbootError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fastbootDevicesRef = useRef<Device[]>([]);
  const refreshInFlightRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const emptyPollCountRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyFastbootDevices = useCallback((devices: Device[]) => {
    if (!isMountedRef.current) {
      return;
    }
    fastbootDevicesRef.current = devices;
    setFastbootDevices((current) => (areDeviceListsEqual(current, devices) ? current : devices));
  }, []);

  const refreshFastbootDevices = useCallback(
    async ({ silent }: { silent?: boolean } = {}) => {
      if (refreshInFlightRef.current) {
        queuedRefreshRef.current = true;
        return;
      }

      refreshInFlightRef.current = true;
      if (!silent && isMountedRef.current) {
        setIsRefreshingFastboot(true);
      }

      try {
        const result = await GetFastbootDevices();
        if (!isMountedRef.current) {
          return;
        }
        const sanitizedDevices = sanitizeFastbootDevices(result);
        setFastbootError(null);

        if (sanitizedDevices.length > 0) {
          emptyPollCountRef.current = 0;
          applyFastbootDevices(sanitizedDevices);
        } else {
          emptyPollCountRef.current += 1;
          if (fastbootDevicesRef.current.length === 0 || emptyPollCountRef.current >= 2) {
            applyFastbootDevices([]);
          }
        }
      } catch (error) {
        console.error("Error refreshing fastboot devices:", error);
        if (isMountedRef.current) {
          setFastbootError("Failed to refresh fastboot devices.");
        }
      } finally {
        if (isMountedRef.current) {
          setIsRefreshingFastboot(false);
        }
        refreshInFlightRef.current = false;

        if (queuedRefreshRef.current && isMountedRef.current) {
          queuedRefreshRef.current = false;
          refreshFastbootDevices({ silent: true });
        } else {
          queuedRefreshRef.current = false;
        }
      }
    },
    [applyFastbootDevices]
  );

  useEffect(() => {
    fastbootDevicesRef.current = fastbootDevices;
  }, [fastbootDevices]);

  useEffect(() => {
    if (activeView !== "flasher") {
      return;
    }

    emptyPollCountRef.current = 0;
    refreshFastbootDevices();
    const interval = window.setInterval(() => {
      refreshFastbootDevices({ silent: true });
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeView, refreshFastbootDevices]);

  const handleSelectFile = async () => {
    try {
      const selectedPath = await SelectImageFile();

      if (selectedPath) {
        setFilePath(selectedPath);
        toast.info(`File selected: ${selectedPath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      console.error("File selection error:", error);
      toast.error("Failed to open file dialog", { description: String(error) });
    }
  };

  const handleSelectSideloadFile = async () => {
    try {
      const selectedPath = await SelectZipFile();

      if (selectedPath) {
        setSideloadFilePath(selectedPath);
        toast.info(`ZIP selected: ${selectedPath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      console.error("ZIP selection error:", error);
      toast.error("Failed to open file dialog", { description: String(error) });
    }
  };

  const handleFlash = async () => {
    if (!selectedFastbootSerial) {
      toast.error("Select an active fastboot device before flashing.");
      return;
    }

    if (!partition) {
      toast.error("Partition name cannot be empty.");
      return;
    }
    if (!filePath) {
      toast.error("No file selected.");
      return;
    }

    setIsFlashing(true);
    const toastId = toast.loading(`Flashing ${partition} partition...`);

    try {
      await FlashPartition(partition, filePath);
      toast.success("Flash Complete", { description: `${partition} flashed successfully.`, id: toastId });
    } catch (error) {
      console.error("Flash error:", error);
      toast.error("Flash Failed", { description: String(error), id: toastId });
    } finally {
      setIsFlashing(false);
    }
  };

  const handleSideload = async () => {
    if (!selectedFastbootSerial) {
      toast.error("Select an active device before sideloading.");
      return;
    }

    if (!sideloadFilePath) {
      toast.error("No update package selected.");
      return;
    }

    const fileName = sideloadFilePath.split(/[/\\]/).pop() ?? "update.zip";
    setIsSideloading(true);
    const toastId = toast.loading(`Sideloading ${fileName}...`);

    try {
      const output = await SideloadPackage(sideloadFilePath);
      const description = output ? output : `${fileName} sideloaded successfully.`;
      toast.success("Sideload Complete", { description, id: toastId });
    } catch (error) {
      console.error("Sideload error:", error);
      toast.error("Sideload Failed", { description: String(error), id: toastId });
    } finally {
      setIsSideloading(false);
    }
  };

  const handleWipe = async () => {
    if (!selectedFastbootSerial) {
      toast.error("Select an active fastboot device before wiping data.");
      return;
    }

    setIsWiping(true);
    const toastId = toast.loading("Wiping data... Device will factory reset.");

    try {
      await WipeData();
      toast.success("Wipe Complete", { description: "Device data has been erased.", id: toastId });
    } catch (error) {
      console.error("Wipe error:", error);
      toast.error("Wipe Failed", { description: String(error), id: toastId });
    } finally {
      setIsWiping(false);
    }
  };

  const handleSelectRomFolder = async (path?: string) => {
    if (path !== undefined) {
      setRomFolderPath(path);
    }
  };

  const handleScanRomFolder = async () => {
    if (!romFolderPath) return;
    setIsScanningFolder(true);
    try {
      const plan = await ScanRomFolder(romFolderPath);
      setFlashPlan(plan);
      toast.success(`Scanned successfully. Found ${plan.steps?.length || 0} images to flash.`);
    } catch (error) {
      toast.error("Scan Failed", { description: String(error) });
      setFlashPlan(null);
    } finally {
      setIsScanningFolder(false);
    }
  };

  const handleBatchFlash = async () => {
    if (!flashPlan || !flashPlan.steps || flashPlan.steps.length === 0) return;
    if (!selectedFastbootSerial) {
      toast.error("No fastboot device connected.");
      return;
    }

    setIsBatchFlashing(true);
    const serial = selectedFastbootSerial;
    const toastId = toast.loading(`Starting batch flash sequence (${flashPlan.steps.length} partitions)...`);

    try {
      await FlashRomFolder(serial, romFolderPath, flashPlan);
      toast.success("Batch Flash Complete", { description: "All partitions flashed successfully.", id: toastId });
    } catch (error) {
      console.error("Batch flash error:", error);
      toast.error("Batch Flash Failed", { description: String(error), id: toastId });
    } finally {
      setIsBatchFlashing(false);
    }
  };

  const handleRefreshSlot = async () => {
    if (!selectedFastbootSerial) return;
    setIsChangingSlot(true);
    try {
      const slot = await GetFastbootSlot(selectedFastbootSerial);
      setCurrentSlot(slot);
    } catch (error) {
      console.error("Failed to get slot", error);
      toast.error("Slot Detection Failed", { description: String(error) });
      setCurrentSlot(null);
    } finally {
      setIsChangingSlot(false);
    }
  };

  const handleSetSlot = async (slot: string) => {
    if (!selectedFastbootSerial) return;
    setIsChangingSlot(true);
    const toastId = toast.loading(`Setting active slot to ${slot}...`);
    try {
      await SetFastbootSlot(selectedFastbootSerial, slot);
      setCurrentSlot(slot);
      toast.success("Slot Changed", { description: `Active slot set to ${slot}`, id: toastId });
    } catch (error) {
      console.error("Failed to set slot", error);
      toast.error("Slot Change Failed", { description: String(error), id: toastId });
    } finally {
      setIsChangingSlot(false);
    }
  };

  const hasSideloadDevice = fastbootDevices.some(d => d.Status === "sideload" || d.Status === "recovery");
  const hasFastbootDevice = fastbootDevices.some(d => d.Status === "fastboot");
  const selectedFastbootSerial =
    activeSerial && fastbootDevices.some((device) => device.Serial === activeSerial)
      ? activeSerial
      : (fastbootDevices[0]?.Serial ?? "");
  const canRunDestructiveActions = hasFastbootDevice && Boolean(selectedFastbootSerial);

  return (
    <div className="flex flex-col gap-6">
      <FastbootDevicesCard devices={fastbootDevices} isRefreshing={isRefreshingFastboot} error={fastbootError} onRefresh={() => refreshFastbootDevices()} />

      <SlotManagerCard 
        currentSlot={currentSlot} 
        onRefreshSlot={handleRefreshSlot} 
        onSetSlot={handleSetSlot} 
        isChangingSlot={isChangingSlot} 
        canManage={canRunDestructiveActions} 
      />

      <FlashPartitionCard partition={partition} onPartitionChange={setPartition} filePath={filePath} onSelectFile={handleSelectFile} onFlash={handleFlash} isFlashing={isFlashing} canFlash={canRunDestructiveActions} />

      <FlashRomFolderCard 
        folderPath={romFolderPath}
        plan={flashPlan}
        onSelectFolder={handleSelectRomFolder}
        onScanFolder={handleScanRomFolder}
        onFlash={handleBatchFlash}
        isScanning={isScanningFolder}
        isFlashing={isBatchFlashing}
        canFlash={canRunDestructiveActions}
      />

      <RecoveryActionsCard
        sideloadFilePath={sideloadFilePath}
        onSelectSideloadFile={handleSelectSideloadFile}
        isSideloading={isSideloading}
        onSideload={handleSideload}
        isWiping={isWiping}
        onWipe={handleWipe}
        canWipe={canRunDestructiveActions}
        isRecoveryMode={hasSideloadDevice}
      />
    </div>
  );
}
