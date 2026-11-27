package debloater

import (
	"ADBKit/internal/core"
	"ADBKit/internal/device"
	packagemgr "ADBKit/internal/package_mgr"
	"context"
	"fmt"
	"sort"
	"strings"
)

type PackageOps interface {
	ListPackages(ctx context.Context, filterType string) ([]packagemgr.Info, error)
	ListUninstalledPackages(ctx context.Context) ([]string, error)
	UninstallPackageForUser0(ctx context.Context, packageName string, keepData bool) (string, error)
	DisablePackage(ctx context.Context, packageName string) (string, error)
	RestorePackage(ctx context.Context, packageName string) (string, error)
}

type DeviceLookup interface {
	GetDeviceInfo(ctx context.Context, serial string) (*device.Info, error)
}

type Service struct {
	catalog             *Catalog
	pkgOps              PackageOps
	devLookup           DeviceLookup
	resolveActiveSerial func(context.Context) (string, error)
}

func NewService(
	dataDir string,
	pkgOps PackageOps,
	devLookup DeviceLookup,
	resolveActiveSerial func(context.Context) (string, error),
) (*Service, error) {
	cat, err := LoadCatalog(dataDir)
	if err != nil {
		return nil, err
	}
	return &Service{
		catalog:             cat,
		pkgOps:              pkgOps,
		devLookup:           devLookup,
		resolveActiveSerial: resolveActiveSerial,
	}, nil
}

func (s *Service) GetCatalogMeta() CatalogMeta {
	return s.catalog.Meta()
}

func (s *Service) ImportCustomCatalog(filePath string) (CatalogMeta, error) {
	return s.catalog.ImportCustomCatalog(filePath)
}

func (s *Service) ClearCustomCatalog() (CatalogMeta, error) {
	return s.catalog.ClearCustomCatalog()
}

func (s *Service) ExportTemplate(filePath string) (string, error) {
	return s.catalog.ExportTemplate(filePath)
}

// Scan intersects the merged non-critical catalog against all packages actually
// installed on the active device (both System and User). Critical packages are
// never exposed in the candidate list.
func (s *Service) Scan(ctx context.Context) (ScanResult, error) {
	serial, err := s.requireSerial(ctx)
	if err != nil {
		return ScanResult{}, err
	}

	installed, err := s.pkgOps.ListPackages(ctx, "all")
	if err != nil {
		return ScanResult{}, err
	}

	installedMap := make(map[string]packagemgr.Info, len(installed))
	for _, pkg := range installed {
		installedMap[pkg.PackageName] = pkg
	}

	var brand, manufacturer, model string
	if s.devLookup != nil {
		if info, err := s.devLookup.GetDeviceInfo(ctx, serial); err == nil && info != nil {
			brand = info.Brand
			manufacturer = info.Manufacturer
			model = info.Model
		}
	}

	items := make([]ScanItem, 0)
	counts := ScanCounts{}
	for _, entry := range s.catalog.MergedEntries() {
		if entry.Risk == RiskCritical {
			continue
		}
		pkgInfo, ok := installedMap[entry.PackageName]
		if !ok {
			continue
		}

		items = append(items, ScanItem{
			PackageName:       entry.PackageName,
			AppName:           entry.AppName,
			Vendor:            entry.Vendor,
			Category:          entry.Category,
			Risk:              entry.Risk,
			Description:       entry.Description,
			Legacy:            entry.Legacy,
			AospReused:        entry.AospReused,
			AutoEnableWarning: entry.AutoEnableWarning,
			Source:            entry.Source,
			IsEnabled:         pkgInfo.IsEnabled,
			IsSystemApp:       pkgInfo.IsSystemApp,
		})

		counts.Total++
		if entry.Risk == RiskSafe {
			counts.Safe++
		} else {
			counts.Caution++
		}
		if pkgInfo.IsSystemApp {
			counts.System++
		} else {
			counts.User++
		}
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].Risk != items[j].Risk {
			return items[i].Risk == RiskSafe
		}
		return strings.ToLower(items[i].AppName) < strings.ToLower(items[j].AppName)
	})

	return ScanResult{
		DeviceSerial:       serial,
		DeviceBrand:        brand,
		DeviceManufacturer: manufacturer,
		DeviceModel:        model,
		CatalogVersion:     s.catalog.Meta().Version,
		Items:              items,
		Presets:            buildPresets(items),
		Counts:             counts,
	}, nil
}

func buildPresets(items []ScanItem) []Preset {
	var xiaomiAds, allSafe, partnerPreloads, googleSafe []string
	for _, item := range items {
		if item.Risk != RiskSafe {
			continue
		}
		allSafe = append(allSafe, item.PackageName)
		switch {
		case item.Vendor == "xiaomi" && item.Category == "Ads & Telemetry":
			xiaomiAds = append(xiaomiAds, item.PackageName)
		case item.Vendor == "third-party":
			partnerPreloads = append(partnerPreloads, item.PackageName)
		case item.Vendor == "google":
			googleSafe = append(googleSafe, item.PackageName)
		}
	}

	candidates := []Preset{
		{
			ID:           "xiaomi-ads",
			Name:         "Xiaomi Ads & Telemetry",
			Description:  "Safe Xiaomi ad services, analytics, and telemetry daemons",
			Vendor:       "xiaomi",
			PackageNames: xiaomiAds,
		},
		{
			ID:           "all-safe",
			Name:         "All Safe",
			Description:  "All installed low-risk bloatware across every vendor",
			Vendor:       "all",
			PackageNames: allSafe,
		},
		{
			ID:           "third-party",
			Name:         "Partner Preloads",
			Description:  "Preinstalled Facebook, Amazon, Booking, TikTok, and partner apps",
			Vendor:       "third-party",
			PackageNames: partnerPreloads,
		},
		{
			ID:           "google-safe",
			Name:         "Google Safe",
			Description:  "Optional Google apps safe to remove without affecting core services",
			Vendor:       "google",
			PackageNames: googleSafe,
		},
	}

	presets := make([]Preset, 0, len(candidates))
	for _, p := range candidates {
		if len(p.PackageNames) > 0 {
			presets = append(presets, p)
		}
	}
	return presets
}

func (s *Service) ListRestorable(ctx context.Context) ([]UninstalledItem, error) {
	if _, err := s.requireSerial(ctx); err != nil {
		return nil, err
	}

	uninstalled, err := s.pkgOps.ListUninstalledPackages(ctx)
	if err != nil {
		return nil, err
	}

	items := make([]UninstalledItem, 0, len(uninstalled))
	for _, pkg := range uninstalled {
		item := UninstalledItem{PackageName: pkg}
		if entry, ok := s.catalog.Lookup(pkg); ok && entry.Risk != RiskCritical {
			item.AppName = entry.AppName
			item.Vendor = entry.Vendor
			item.Category = entry.Category
			item.Risk = entry.Risk
			item.Description = entry.Description
			item.InCatalog = true
		}
		items = append(items, item)
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].InCatalog != items[j].InCatalog {
			return items[i].InCatalog
		}
		return items[i].PackageName < items[j].PackageName
	})
	return items, nil
}

func (s *Service) Debloat(ctx context.Context, packageNames []string, keepData bool) (BatchResult, error) {
	return s.runProtectedBatch(ctx, "debloat", packageNames, func(pkg string) (string, error) {
		return s.pkgOps.UninstallPackageForUser0(ctx, pkg, keepData)
	})
}

func (s *Service) Disable(ctx context.Context, packageNames []string) (BatchResult, error) {
	return s.runProtectedBatch(ctx, "disable", packageNames, func(pkg string) (string, error) {
		return s.pkgOps.DisablePackage(ctx, pkg)
	})
}

func (s *Service) Restore(ctx context.Context, packageNames []string) (BatchResult, error) {
	if _, err := s.requireSerial(ctx); err != nil {
		return BatchResult{}, err
	}

	cleaned := dedupePackageNames(packageNames)
	if len(cleaned) == 0 {
		return BatchResult{}, core.NewOperationError("restore_packages", "No packages were selected", "package list must not be empty", false)
	}

	res := BatchResult{
		Action:  "restore",
		Total:   len(cleaned),
		Results: make([]ActionItemResult, 0, len(cleaned)),
	}

	for _, pkg := range cleaned {
		msg, err := s.pkgOps.RestorePackage(ctx, pkg)
		if err != nil {
			res.Failed++
			res.Results = append(res.Results, ActionItemResult{
				PackageName: pkg,
				Success:     false,
				Message:     err.Error(),
			})
			continue
		}
		res.Succeeded++
		res.Results = append(res.Results, ActionItemResult{
			PackageName: pkg,
			Success:     true,
			Message:     msg,
		})
	}

	return res, nil
}

func (s *Service) runProtectedBatch(
	ctx context.Context,
	action string,
	packageNames []string,
	execFn func(string) (string, error),
) (BatchResult, error) {
	if _, err := s.requireSerial(ctx); err != nil {
		return BatchResult{}, err
	}

	cleaned := dedupePackageNames(packageNames)
	if len(cleaned) == 0 {
		return BatchResult{}, core.NewOperationError(action+"_packages", "No packages were selected", "package list must not be empty", false)
	}

	res := BatchResult{
		Action:  action,
		Total:   len(cleaned),
		Results: make([]ActionItemResult, 0, len(cleaned)),
	}

	for _, pkg := range cleaned {
		if s.catalog.IsProtected(pkg) {
			res.Skipped++
			res.Results = append(res.Results, ActionItemResult{
				PackageName: pkg,
				Success:     false,
				Skipped:     true,
				Message:     "Blocked: critical system package (bootloop risk)",
			})
			continue
		}

		msg, err := execFn(pkg)
		if err != nil {
			res.Failed++
			res.Results = append(res.Results, ActionItemResult{
				PackageName: pkg,
				Success:     false,
				Message:     err.Error(),
			})
			continue
		}
		res.Succeeded++
		res.Results = append(res.Results, ActionItemResult{
			PackageName: pkg,
			Success:     true,
			Message:     msg,
		})
	}

	if res.Skipped == res.Total {
		return res, core.NewOperationError(
			action+"_packages",
			"All selected packages are protected critical system packages",
			fmt.Sprintf("blocked %d critical package(s)", res.Skipped),
			false,
		)
	}

	return res, nil
}

func (s *Service) requireSerial(ctx context.Context) (string, error) {
	if s.resolveActiveSerial == nil {
		return "", core.NewOperationError("resolve_active_serial", "Device selection is unavailable", "active serial resolver is not configured", false)
	}
	serial, err := s.resolveActiveSerial(ctx)
	if err != nil {
		return "", core.NewOperationError("resolve_active_serial", "No active device is available", err.Error(), true)
	}
	return strings.TrimSpace(serial), nil
}

func dedupePackageNames(names []string) []string {
	seen := make(map[string]struct{}, len(names))
	out := make([]string, 0, len(names))
	for _, raw := range names {
		trimmed := strings.TrimSpace(raw)
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		out = append(out, trimmed)
	}
	return out
}
