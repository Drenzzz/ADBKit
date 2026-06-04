package file

type Entry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	Type        string `json:"type"`
	Size        int64  `json:"size"`
	SizeHuman   string `json:"sizeHuman"`
	Permissions string `json:"permissions"`
	ModifiedAt  string `json:"modifiedAt"`
	IsHidden    bool   `json:"isHidden"`
}

type StorageInfo struct {
	MountPoint string `json:"mountPoint"`
	TotalBytes int64  `json:"totalBytes"`
	UsedBytes  int64  `json:"usedBytes"`
	FreeBytes  int64  `json:"freeBytes"`
	UsedPct    int    `json:"usedPct"`
}

type TransferProgress struct {
	FileName  string `json:"fileName"`
	Direction string `json:"direction"`
	Percent   int    `json:"percent"`
}
