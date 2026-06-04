package device

type PerformanceSnapshot struct {
	Serial              string  `json:"serial"`
	CPUUsage            float64 `json:"cpuUsage"`
	RAMUsage            float64 `json:"ramUsage"`
	RAMUsedBytes        int64   `json:"ramUsedBytes,omitempty"`
	RAMTotalBytes       int64   `json:"ramTotalBytes,omitempty"`
	NetworkRxBytes      int64   `json:"networkRxBytes,omitempty"`
	NetworkTxBytes      int64   `json:"networkTxBytes,omitempty"`
	NetworkRxSec        float64 `json:"networkRxSec"`
	NetworkTxSec        float64 `json:"networkTxSec"`
	BatteryLevel        int     `json:"batteryLevel,omitempty"`
	BatteryTemperatureC float64 `json:"batteryTemperatureC,omitempty"`
	StorageUsedBytes    int64   `json:"storageUsedBytes,omitempty"`
	StorageTotalBytes   int64   `json:"storageTotalBytes,omitempty"`
	UptimeSeconds       int64   `json:"uptimeSeconds,omitempty"`
}
