package app

import "ADBKit/internal/file"

func (a *App) ListFiles(remotePath string, showHidden bool) ([]file.Entry, error) {
	return auditAction(a, "list_files", func() ([]file.Entry, error) {
		return a.fileSvc.ListFiles(a.ctx, remotePath, showHidden)
	})
}

func (a *App) GetDirectorySize(remotePath string) (string, error) {
	return auditAction(a, "get_directory_size", func() (string, error) {
		return a.fileSvc.GetDirectorySize(a.ctx, remotePath)
	})
}

func (a *App) GetStorageInfo() (file.StorageInfo, error) {
	return auditAction(a, "get_storage_info", func() (file.StorageInfo, error) {
		return a.fileSvc.GetStorageInfo(a.ctx)
	})
}

func (a *App) PullFile(remotePath string, localPath string) (string, error) {
	return auditAction(a, "pull_file", func() (string, error) {
		return a.fileSvc.PullFile(a.ctx, remotePath, localPath)
	})
}

func (a *App) PullMultipleFiles(remotePaths []string, localDirectory string) (string, error) {
	return auditAction(a, "pull_multiple_files", func() (string, error) {
		return a.fileSvc.PullMultipleFiles(a.ctx, remotePaths, localDirectory)
	})
}

func (a *App) PushFile(localPath string, remotePath string) (string, error) {
	return auditAction(a, "push_file", func() (string, error) {
		return a.fileSvc.PushFile(a.ctx, localPath, remotePath)
	})
}

func (a *App) PushMultipleFiles(localPaths []string, remoteDirectory string) (string, error) {
	return auditAction(a, "push_multiple_files", func() (string, error) {
		return a.fileSvc.PushMultipleFiles(a.ctx, localPaths, remoteDirectory)
	})
}

func (a *App) DeleteFile(remotePath string) (string, error) {
	return auditAction(a, "delete_file", func() (string, error) {
		return a.fileSvc.DeleteFile(a.ctx, remotePath)
	})
}

func (a *App) DeleteMultipleFiles(remotePaths []string) (string, error) {
	return auditAction(a, "delete_multiple_files", func() (string, error) {
		return a.fileSvc.DeleteMultipleFiles(a.ctx, remotePaths)
	})
}

func (a *App) CreateDirectory(remotePath string) (string, error) {
	return auditAction(a, "create_directory", func() (string, error) {
		return a.fileSvc.CreateDirectory(a.ctx, remotePath)
	})
}

func (a *App) RenameFile(oldRemotePath string, newRemotePath string) (string, error) {
	return auditAction(a, "rename_file", func() (string, error) {
		return a.fileSvc.RenameFile(a.ctx, oldRemotePath, newRemotePath)
	})
}

func (a *App) CancelFileTransfer() {
	if a.fileSvc != nil {
		a.fileSvc.CancelTransfer()
	}
}

func (a *App) SelectFile() (string, error) {
	return a.diaSvc.SelectFile()
}

func (a *App) SelectDirectory() (string, error) {
	return a.diaSvc.SelectDirectory()
}

func (a *App) SelectMultipleFiles() ([]string, error) {
	return a.diaSvc.SelectMultipleFiles()
}
