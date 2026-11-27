package app

import (
	"ADBKit/internal/core"
	"ADBKit/internal/debloater"
)

func (a *App) requireDebloaterService() (*debloater.Service, error) {
	if a.debloatSvc == nil {
		return nil, core.NewOperationError("debloater_unavailable", "Debloater service is unavailable", "service was not initialized", false)
	}
	return a.debloatSvc, nil
}

func (a *App) ScanDebloater() (debloater.ScanResult, error) {
	return auditAction(a, "scan_debloater", func() (debloater.ScanResult, error) {
		svc, err := a.requireDebloaterService()
		if err != nil {
			return debloater.ScanResult{}, err
		}
		return svc.Scan(a.ctx)
	})
}

func (a *App) ListRestorablePackages() ([]debloater.UninstalledItem, error) {
	return auditAction(a, "list_restorable_packages", func() ([]debloater.UninstalledItem, error) {
		svc, err := a.requireDebloaterService()
		if err != nil {
			return nil, err
		}
		return svc.ListRestorable(a.ctx)
	})
}

func (a *App) DebloatPackages(packageNames []string, keepData bool) (debloater.BatchResult, error) {
	return auditAction(a, "debloat_packages", func() (debloater.BatchResult, error) {
		svc, err := a.requireDebloaterService()
		if err != nil {
			return debloater.BatchResult{}, err
		}
		return svc.Debloat(a.ctx, packageNames, keepData)
	})
}

func (a *App) DisableDebloatPackages(packageNames []string) (debloater.BatchResult, error) {
	return auditAction(a, "disable_debloat_packages", func() (debloater.BatchResult, error) {
		svc, err := a.requireDebloaterService()
		if err != nil {
			return debloater.BatchResult{}, err
		}
		return svc.Disable(a.ctx, packageNames)
	})
}

func (a *App) RestorePackages(packageNames []string) (debloater.BatchResult, error) {
	return auditAction(a, "restore_packages", func() (debloater.BatchResult, error) {
		svc, err := a.requireDebloaterService()
		if err != nil {
			return debloater.BatchResult{}, err
		}
		return svc.Restore(a.ctx, packageNames)
	})
}

func (a *App) GetDebloaterCatalogMeta() (debloater.CatalogMeta, error) {
	svc, err := a.requireDebloaterService()
	if err != nil {
		return debloater.CatalogMeta{}, err
	}
	return svc.GetCatalogMeta(), nil
}

func (a *App) ImportCustomDebloaterCatalog(filePath string) (debloater.CatalogMeta, error) {
	return auditAction(a, "import_debloater_catalog", func() (debloater.CatalogMeta, error) {
		svc, err := a.requireDebloaterService()
		if err != nil {
			return debloater.CatalogMeta{}, err
		}
		return svc.ImportCustomCatalog(filePath)
	})
}

func (a *App) ClearCustomDebloaterCatalog() (debloater.CatalogMeta, error) {
	return auditAction(a, "clear_debloater_catalog", func() (debloater.CatalogMeta, error) {
		svc, err := a.requireDebloaterService()
		if err != nil {
			return debloater.CatalogMeta{}, err
		}
		return svc.ClearCustomCatalog()
	})
}

func (a *App) ExportDebloaterTemplate(filePath string) (string, error) {
	return auditAction(a, "export_debloater_template", func() (string, error) {
		svc, err := a.requireDebloaterService()
		if err != nil {
			return "", err
		}
		return svc.ExportTemplate(filePath)
	})
}

func (a *App) SelectJsonFile() (string, error) {
	return a.diaSvc.SelectJsonFile()
}

func (a *App) SelectSaveJsonFile(defaultFilename string) (string, error) {
	return a.diaSvc.SelectSaveFile(defaultFilename)
}
