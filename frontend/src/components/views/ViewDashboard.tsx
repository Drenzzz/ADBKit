import React, { useState, useEffect } from "react";

import { GetDeviceInfo } from "../../../wailsjs/go/backend/App";
import { backend } from "../../../wailsjs/go/models";
import { DeviceListCard } from "../dashboard/DeviceListCard";
import { WirelessAdbCard } from "../dashboard/WirelessAdbCard";
import { DeviceInfoCard } from "../dashboard/DeviceInfoCard";
import { useDevice } from "@/lib/deviceContext";

type DeviceInfo = backend.DeviceInfo;

export function ViewDashboard({ activeView }: { activeView: string }) {
  const { devices, refreshDevices, isRefreshing } = useDevice();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isRefreshingInfo, setIsRefreshingInfo] = useState(false);

  const refreshInfo = async () => {
    if (devices.length === 0) {
      setDeviceInfo(null);
      return;
    }

    setIsRefreshingInfo(true);
    try {
      const result = await GetDeviceInfo();
      setDeviceInfo(result);
    } catch (error) {
      console.error("Error refreshing device info:", error);
      setDeviceInfo(null);
    }
    setIsRefreshingInfo(false);
  };

  useEffect(() => {
    if (activeView === "dashboard") {
      refreshDevices();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "dashboard") {
      const interval = setInterval(() => {
        if (!isRefreshing) {
          refreshDevices();
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeView, isRefreshing, refreshDevices]);

  return (
    <div className="flex flex-col gap-6">
      <DeviceListCard devices={devices} isRefreshing={isRefreshing} onRefresh={refreshDevices} />

      <WirelessAdbCard hasUsbDevice={devices.length > 0} defaultIp={deviceInfo?.IPAddress} onDevicesUpdated={refreshDevices} />

      <DeviceInfoCard devices={devices} deviceInfo={deviceInfo} isRefreshing={isRefreshingInfo} onRefresh={refreshInfo} />
    </div>
  );
}
