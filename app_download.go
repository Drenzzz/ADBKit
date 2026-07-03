package main

func (a *App) DownloadPlatformTools() error {
	return auditVoidAction(a, "download_platform_tools", func() error {
		return a.dlSvc.DownloadPlatformTools(a.ctx)
	})
}

func (a *App) DownloadScrcpy() error {
	return auditVoidAction(a, "download_scrcpy", func() error {
		return a.dlSvc.DownloadScrcpy(a.ctx)
	})
}
