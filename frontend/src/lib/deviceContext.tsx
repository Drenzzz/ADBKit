import React, { createContext, useContext, useState, useEffect } from "react";
import { GetDevices, GetFastbootDevices, SetActiveSerial } from "../../wailsjs/go/backend/App";
import { backend } from "../../wailsjs/go/models";

interface DeviceContextType {
  activeSerial: string | null;
  setActiveSerial: (serial: string | null) => void;
  devices: backend.Device[];
  fastbootDevices: backend.Device[];
  refreshDevices: () => Promise<void>;
  isRefreshing: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [activeSerial, setActiveSerial] = useState<string | null>(null);
  const [devices, setDevices] = useState<backend.Device[]>([]);
  const [fastbootDevices, setFastbootDevices] = useState<backend.Device[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshDevices = async () => {
    setIsRefreshing(true);
    try {
      const adbDevs = await GetDevices() || [];
      const fbDevs = await GetFastbootDevices() || [];
      
      setDevices(adbDevs);
      setFastbootDevices(fbDevs);

      // Auto-select first device if nothing is selected
      if (!activeSerial) {
        if (adbDevs.length > 0) {
          setActiveSerial(adbDevs[0].Serial);
        } else if (fbDevs.length > 0) {
          setActiveSerial(fbDevs[0].Serial);
        }
      } else {
        // Verify active device is still connected
        const stillConnected = [...adbDevs, ...fbDevs].some(d => d.Serial === activeSerial);
        if (!stillConnected) {
          setActiveSerial(null);
        }
      }
    } catch (error) {
      console.error("Failed to refresh devices:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch and periodic polling
  useEffect(() => {
    refreshDevices();
    const interval = setInterval(refreshDevices, 5000);
    return () => clearInterval(interval);
  }, [activeSerial]);

  useEffect(() => {
    const syncActiveSerial = async () => {
      try {
        await SetActiveSerial(activeSerial ?? "");
      } catch (error) {
        console.error("Failed to sync active serial:", error);
      }
    };

    syncActiveSerial();
  }, [activeSerial]);

  return (
    <DeviceContext.Provider value={{
      activeSerial,
      setActiveSerial,
      devices,
      fastbootDevices,
      refreshDevices,
      isRefreshing
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
}
