package debloater

type RiskTier string

const (
	RiskSafe     RiskTier = "safe"
	RiskCaution  RiskTier = "caution"
	RiskCritical RiskTier = "critical"
)

type CatalogEntry struct {
	PackageName       string   `json:"packageName"`
	AppName           string   `json:"appName"`
	Vendor            string   `json:"vendor"`
	Category          string   `json:"category"`
	Risk              RiskTier `json:"risk"`
	Description       string   `json:"description"`
	Legacy            bool     `json:"legacy,omitempty"`
	AospReused        bool     `json:"aospReused,omitempty"`
	AutoEnableWarning bool     `json:"autoEnableWarning,omitempty"`
	Source            string   `json:"source,omitempty"`
}

type Preset struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Vendor       string   `json:"vendor"`
	PackageNames []string `json:"packageNames"`
}

// ScanItem uses flat fields rather than embedding CatalogEntry so Wails v3
// TypeScript binding generation emits clean, direct properties.
type ScanItem struct {
	PackageName       string   `json:"packageName"`
	AppName           string   `json:"appName"`
	Vendor            string   `json:"vendor"`
	Category          string   `json:"category"`
	Risk              RiskTier `json:"risk"`
	Description       string   `json:"description"`
	Legacy            bool     `json:"legacy"`
	AospReused        bool     `json:"aospReused"`
	AutoEnableWarning bool     `json:"autoEnableWarning"`
	Source            string   `json:"source"`
	IsEnabled         bool     `json:"isEnabled"`
	IsSystemApp       bool     `json:"isSystemApp"`
}

type ScanCounts struct {
	Total   int `json:"total"`
	Safe    int `json:"safe"`
	Caution int `json:"caution"`
	System  int `json:"system"`
	User    int `json:"user"`
}

type ScanResult struct {
	DeviceSerial       string     `json:"deviceSerial"`
	DeviceBrand        string     `json:"deviceBrand"`
	DeviceManufacturer string     `json:"deviceManufacturer"`
	DeviceModel        string     `json:"deviceModel"`
	CatalogVersion     string     `json:"catalogVersion"`
	Items              []ScanItem `json:"items"`
	Presets            []Preset   `json:"presets"`
	Counts             ScanCounts `json:"counts"`
}

type UninstalledItem struct {
	PackageName string   `json:"packageName"`
	AppName     string   `json:"appName,omitempty"`
	Vendor      string   `json:"vendor,omitempty"`
	Category    string   `json:"category,omitempty"`
	Risk        RiskTier `json:"risk,omitempty"`
	Description string   `json:"description,omitempty"`
	InCatalog   bool     `json:"inCatalog"`
}

type ActionItemResult struct {
	PackageName string `json:"packageName"`
	Success     bool   `json:"success"`
	Message     string `json:"message"`
	Skipped     bool   `json:"skipped,omitempty"`
}

type BatchResult struct {
	Action    string             `json:"action"`
	Total     int                `json:"total"`
	Succeeded int                `json:"succeeded"`
	Failed    int                `json:"failed"`
	Skipped   int                `json:"skipped"`
	Results   []ActionItemResult `json:"results"`
}

type CatalogMeta struct {
	Version           string `json:"version"`
	BuiltinCount      int    `json:"builtinCount"`
	CustomCount       int    `json:"customCount"`
	CriticalCount     int    `json:"criticalCount"`
	CustomCatalogPath string `json:"customCatalogPath,omitempty"`
}
