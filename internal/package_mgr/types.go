package packagemgr

type Filter string

type Info struct {
	PackageName string `json:"packageName"`
	IsEnabled   bool   `json:"isEnabled"`
	IsSystemApp bool   `json:"isSystemApp"`
}

type Details struct {
	PackageName    string `json:"packageName"`
	VersionName    string `json:"versionName"`
	VersionCode    string `json:"versionCode"`
	ApkSizeBytes   int64  `json:"apkSizeBytes"`
	DataSizeBytes  int64  `json:"dataSizeBytes"`
	TotalSizeBytes int64  `json:"totalSizeBytes"`
}
