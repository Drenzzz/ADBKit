package main

import packagemgr "ADBKit/internal/package_mgr"

func (a *App) ListPackages(filterType string) ([]packagemgr.Info, error) {
	return auditAction(a, "list_packages", func() ([]packagemgr.Info, error) {
		return a.pkgSvc.ListPackages(a.ctx, filterType)
	})
}

func (a *App) InstallPackage(filePath string) (string, error) {
	return auditAction(a, "install_package", func() (string, error) {
		return a.pkgSvc.InstallPackage(a.ctx, filePath)
	})
}

func (a *App) UninstallPackage(packageName string) (string, error) {
	return auditAction(a, "uninstall_package", func() (string, error) {
		return a.pkgSvc.UninstallPackage(a.ctx, packageName)
	})
}

func (a *App) UninstallMultiplePackages(packageNames []string) (string, error) {
	return auditAction(a, "uninstall_packages", func() (string, error) {
		return a.pkgSvc.UninstallMultiplePackages(a.ctx, packageNames)
	})
}

func (a *App) EnablePackage(packageName string) (string, error) {
	return auditAction(a, "enable_package", func() (string, error) {
		return a.pkgSvc.EnablePackage(a.ctx, packageName)
	})
}

func (a *App) EnableMultiplePackages(packageNames []string) (string, error) {
	return auditAction(a, "enable_packages", func() (string, error) {
		return a.pkgSvc.EnableMultiplePackages(a.ctx, packageNames)
	})
}

func (a *App) DisablePackage(packageName string) (string, error) {
	return auditAction(a, "disable_package", func() (string, error) {
		return a.pkgSvc.DisablePackage(a.ctx, packageName)
	})
}

func (a *App) DisableMultiplePackages(packageNames []string) (string, error) {
	return auditAction(a, "disable_packages", func() (string, error) {
		return a.pkgSvc.DisableMultiplePackages(a.ctx, packageNames)
	})
}

func (a *App) ClearPackageData(packageName string) (string, error) {
	return auditAction(a, "clear_package_data", func() (string, error) {
		return a.pkgSvc.ClearPackageData(a.ctx, packageName)
	})
}

func (a *App) PullPackageApk(packageName string) (string, error) {
	return auditAction(a, "pull_package_apk", func() (string, error) {
		return a.pkgSvc.PullPackageApk(a.ctx, packageName)
	})
}

func (a *App) LaunchPackage(packageName string) (string, error) {
	return auditAction(a, "launch_package", func() (string, error) {
		return a.pkgSvc.LaunchPackage(a.ctx, packageName)
	})
}

func (a *App) ForceStopPackage(packageName string) (string, error) {
	return auditAction(a, "force_stop_package", func() (string, error) {
		return a.pkgSvc.ForceStopPackage(a.ctx, packageName)
	})
}

func (a *App) GetPackageDetails(packageName string) (packagemgr.Details, error) {
	return auditAction(a, "get_package_details", func() (packagemgr.Details, error) {
		return a.pkgSvc.GetPackageDetails(a.ctx, packageName)
	})
}

func (a *App) SelectApkFile() (string, error) {
	return a.diaSvc.SelectApkFile()
}
