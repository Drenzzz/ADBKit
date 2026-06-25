package device

import (
	"ADBKit/internal/core"
	"context"
	"log"
)

type Service struct {
	dataDir string
}

func NewService(dataDir string) *Service {
	return &Service{dataDir: dataDir}
}

// ListDevices menggabungkan device ADB dan fastboot. Fastboot sering tidak
// terpasang, jadi kegagalannya hanya dicatat selama ADB masih berhasil. Error
// dikembalikan hanya bila kedua sumber gagal sehingga UI tidak menyembunyikan
// masalah nyata sebagai "no devices".
func (s *Service) ListDevices(ctx context.Context) ([]Summary, error) {
	adbDevices, adbErr := s.listADBDevices(ctx)
	fastbootDevices, fastbootErr := s.listFastbootDevices(ctx)

	if adbErr != nil && fastbootErr != nil {
		return nil, adbErr
	}
	if adbErr != nil {
		log.Printf("device: adb listing failed: %v", adbErr)
	}
	if fastbootErr != nil {
		log.Printf("device: fastboot listing failed: %v", fastbootErr)
	}

	devices := make([]Summary, 0, len(adbDevices)+len(fastbootDevices))
	devices = append(devices, adbDevices...)
	devices = append(devices, fastbootDevices...)

	return devices, nil
}

func (s *Service) GetDeviceInfo(ctx context.Context, serial string) (*Info, error) {
	devices, err := s.ListDevices(ctx)
	if err != nil {
		return nil, err
	}

	var matched *Summary
	for i := range devices {
		if devices[i].Serial == serial {
			matched = &devices[i]
			break
		}
	}

	if matched == nil {
		return nil, core.NewOperationError("get_device_info", "device was not found", "serial '"+serial+"' is not connected", true)
	}

	info := &Info{
		Serial:      matched.Serial,
		State:       matched.State,
		Mode:        matched.Mode,
		Product:     matched.Product,
		Model:       matched.Model,
		Device:      matched.Device,
		TransportID: matched.TransportID,
	}

	if matched.Mode != ModeADB || matched.State != StateReady {
		info.ConnectionLabel = string(matched.Mode)
		return info, nil
	}

	props, err := s.getDeviceProperties(ctx, matched.Serial)
	if err == nil {
		info.Manufacturer = props["ro.product.manufacturer"]
		info.Brand = props["ro.product.brand"]
		info.AndroidVersion = props["ro.build.version.release"]
		info.SDKVersion = props["ro.build.version.sdk"]
		info.BuildID = props["ro.build.display.id"]
		info.SecurityPatch = props["ro.build.version.security_patch"]
		info.ABIs = props["ro.product.cpu.abilist"]
		info.ConnectionLabel = props["ro.product.name"]
		info.Codename = props["ro.product.device"]

		if info.Product == "" {
			info.Product = props["ro.product.name"]
		}
		if info.Model == "" {
			info.Model = props["ro.product.model"]
		}
		if info.Device == "" {
			info.Device = props["ro.product.device"]
		}

		info.IPAddress = extractDeviceIPAddress(props)
		info.RootStatus = extractRootStatus(props)
	}

	batteryLevel, err := s.getBatteryLevel(ctx, matched.Serial)
	if err == nil {
		info.BatteryLevel = batteryLevel
	}

	storageInfo, err := s.getStorageInfo(ctx, matched.Serial)
	if err == nil {
		info.StorageInfo = storageInfo
	}

	ramTotal, err := s.getRAMTotal(ctx, matched.Serial)
	if err == nil {
		info.RAMTotal = ramTotal
	}

	return info, nil
}

func (s *Service) DetectDeviceMode(ctx context.Context, serial string) (Mode, error) {
	devices, err := s.ListDevices(ctx)
	if err != nil {
		return ModeUnknown, err
	}

	for _, device := range devices {
		if device.Serial == serial {
			return device.Mode, nil
		}
	}

	return ModeUnknown, core.NewOperationError("detect_device_mode", "device mode could not be determined", "serial '"+serial+"' is not connected", true)
}
