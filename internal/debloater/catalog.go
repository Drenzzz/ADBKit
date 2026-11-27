package debloater

import (
	"ADBKit/internal/core"
	packagemgr "ADBKit/internal/package_mgr"
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

//go:embed data/builtin_catalog.json
var builtinCatalogJSON []byte

const (
	customCatalogFilename = "debloater_custom_catalog.json"
	maxCatalogFileBytes   = 5 * 1024 * 1024
)

type catalogFile struct {
	Version  string         `json:"version"`
	Packages []CatalogEntry `json:"packages"`
}

type Catalog struct {
	version       string
	builtin       []CatalogEntry
	criticalSet   map[string]struct{}
	customPath    string
	customEntries []CatalogEntry
}

func LoadCatalog(dataDir string) (*Catalog, error) {
	var parsed catalogFile
	if err := json.Unmarshal(builtinCatalogJSON, &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse embedded debloater catalog: %w", err)
	}

	c := &Catalog{
		version:     strings.TrimSpace(parsed.Version),
		builtin:     make([]CatalogEntry, 0, len(parsed.Packages)),
		criticalSet: make(map[string]struct{}),
	}
	if c.version == "" {
		c.version = "1.0.0"
	}

	seen := make(map[string]struct{}, len(parsed.Packages))
	for _, entry := range parsed.Packages {
		normalized, err := normalizeCatalogEntry(entry, "builtin")
		if err != nil {
			return nil, fmt.Errorf("invalid builtin catalog entry %q: %w", entry.PackageName, err)
		}
		if _, dup := seen[normalized.PackageName]; dup {
			return nil, fmt.Errorf("duplicate builtin catalog package %q", normalized.PackageName)
		}
		seen[normalized.PackageName] = struct{}{}
		if normalized.Risk == RiskCritical {
			c.criticalSet[normalized.PackageName] = struct{}{}
		}
		c.builtin = append(c.builtin, normalized)
	}

	if strings.TrimSpace(dataDir) != "" {
		c.customPath = filepath.Join(dataDir, customCatalogFilename)
		if err := c.reloadCustom(); err != nil {
			return nil, err
		}
	}

	return c, nil
}

func (c *Catalog) reloadCustom() error {
	c.customEntries = nil
	if c.customPath == "" {
		return nil
	}
	raw, err := os.ReadFile(c.customPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return core.NewOperationError("load_custom_catalog", "Failed to read custom debloater catalog", err.Error(), false)
	}
	entries, err := parseCustomCatalogBytes(raw)
	if err != nil {
		return err
	}
	c.customEntries = entries
	return nil
}

func (c *Catalog) ImportCustomCatalog(filePath string) (CatalogMeta, error) {
	trimmed := strings.TrimSpace(filePath)
	if trimmed == "" {
		return c.Meta(), core.NewOperationError("import_custom_catalog", "Catalog file path is required", "file path must not be empty", false)
	}

	info, err := os.Stat(trimmed)
	if err != nil {
		return c.Meta(), core.NewOperationError("import_custom_catalog", "Cannot access catalog file", err.Error(), false)
	}
	if info.IsDir() {
		return c.Meta(), core.NewOperationError("import_custom_catalog", "Selected path is a directory", trimmed, false)
	}
	if info.Size() > maxCatalogFileBytes {
		return c.Meta(), core.NewOperationError("import_custom_catalog", "Catalog file is too large", "maximum size is 5 MB", false)
	}

	raw, err := os.ReadFile(trimmed)
	if err != nil {
		return c.Meta(), core.NewOperationError("import_custom_catalog", "Failed to read catalog file", err.Error(), false)
	}

	entries, err := parseCustomCatalogBytes(raw)
	if err != nil {
		return c.Meta(), err
	}
	if len(entries) == 0 {
		return c.Meta(), core.NewOperationError("import_custom_catalog", "Custom catalog contains no packages", "packages array is empty", false)
	}

	if c.customPath != "" {
		if err := os.MkdirAll(filepath.Dir(c.customPath), 0o700); err != nil {
			return c.Meta(), core.NewOperationError("import_custom_catalog", "Failed to prepare catalog directory", err.Error(), false)
		}
		payload, err := json.MarshalIndent(catalogFile{Version: "custom", Packages: entries}, "", "  ")
		if err != nil {
			return c.Meta(), core.NewOperationError("import_custom_catalog", "Failed to encode custom catalog", err.Error(), false)
		}
		if err := os.WriteFile(c.customPath, payload, 0o600); err != nil {
			return c.Meta(), core.NewOperationError("import_custom_catalog", "Failed to save custom catalog", err.Error(), false)
		}
	}

	c.customEntries = entries
	return c.Meta(), nil
}

func (c *Catalog) ClearCustomCatalog() (CatalogMeta, error) {
	if c.customPath != "" {
		if err := os.Remove(c.customPath); err != nil && !os.IsNotExist(err) {
			return c.Meta(), core.NewOperationError("clear_custom_catalog", "Failed to remove custom catalog", err.Error(), false)
		}
	}
	c.customEntries = nil
	return c.Meta(), nil
}

func (c *Catalog) ExportTemplate(filePath string) (string, error) {
	trimmed := strings.TrimSpace(filePath)
	if trimmed == "" {
		return "", core.NewOperationError("export_debloater_template", "Destination file path is required", "file path must not be empty", false)
	}
	template := catalogFile{
		Version: "custom-1.0",
		Packages: []CatalogEntry{
			{
				PackageName: "com.example.bloatware",
				AppName:     "Example Preload",
				Vendor:      "third-party",
				Category:    "Partner Preloads",
				Risk:        RiskSafe,
				Description: "Sample custom catalog entry. Use risk: safe, caution, or critical.",
			},
		},
	}
	data, err := json.MarshalIndent(template, "", "  ")
	if err != nil {
		return "", core.NewOperationError("export_debloater_template", "Failed to encode template", err.Error(), false)
	}
	if err := os.WriteFile(trimmed, data, 0o600); err != nil {
		return "", core.NewOperationError("export_debloater_template", "Failed to write template file", err.Error(), false)
	}
	return trimmed, nil
}

func (c *Catalog) Meta() CatalogMeta {
	customPath := ""
	if len(c.customEntries) > 0 {
		customPath = c.customPath
	}
	return CatalogMeta{
		Version:           c.version,
		BuiltinCount:      len(c.builtin),
		CustomCount:       len(c.customEntries),
		CriticalCount:     len(c.criticalSet),
		CustomCatalogPath: customPath,
	}
}

// IsProtected returns true when a package is in the immutable built-in critical
// blocklist or marked critical in the custom catalog.
func (c *Catalog) IsProtected(packageName string) bool {
	trimmed := strings.TrimSpace(packageName)
	if _, ok := c.criticalSet[trimmed]; ok {
		return true
	}
	for _, entry := range c.customEntries {
		if entry.PackageName == trimmed && entry.Risk == RiskCritical {
			return true
		}
	}
	return false
}

// MergedEntries returns built-in entries merged with custom entries.
// Built-in critical packages can never be overridden or downgraded.
func (c *Catalog) MergedEntries() []CatalogEntry {
	byPkg := make(map[string]CatalogEntry, len(c.builtin)+len(c.customEntries))
	order := make([]string, 0, len(c.builtin)+len(c.customEntries))

	for _, entry := range c.builtin {
		byPkg[entry.PackageName] = entry
		order = append(order, entry.PackageName)
	}

	for _, entry := range c.customEntries {
		if _, isBuiltinCritical := c.criticalSet[entry.PackageName]; isBuiltinCritical {
			continue
		}
		if _, exists := byPkg[entry.PackageName]; !exists {
			order = append(order, entry.PackageName)
		}
		byPkg[entry.PackageName] = entry
	}

	out := make([]CatalogEntry, 0, len(order))
	for _, pkg := range order {
		out = append(out, byPkg[pkg])
	}
	return out
}

func (c *Catalog) Lookup(packageName string) (CatalogEntry, bool) {
	trimmed := strings.TrimSpace(packageName)
	if _, isBuiltinCritical := c.criticalSet[trimmed]; isBuiltinCritical {
		for _, entry := range c.builtin {
			if entry.PackageName == trimmed {
				return entry, true
			}
		}
	}
	for _, entry := range c.customEntries {
		if entry.PackageName == trimmed {
			return entry, true
		}
	}
	for _, entry := range c.builtin {
		if entry.PackageName == trimmed {
			return entry, true
		}
	}
	return CatalogEntry{}, false
}

func parseCustomCatalogBytes(raw []byte) ([]CatalogEntry, error) {
	var wrapper catalogFile
	var rawEntries []CatalogEntry

	if err := json.Unmarshal(raw, &wrapper); err == nil && wrapper.Packages != nil {
		rawEntries = wrapper.Packages
	} else if err := json.Unmarshal(raw, &rawEntries); err != nil {
		return nil, core.NewOperationError("import_custom_catalog", "Invalid JSON catalog format", err.Error(), false)
	}

	normalized := make([]CatalogEntry, 0, len(rawEntries))
	seen := make(map[string]struct{}, len(rawEntries))
	for _, entry := range rawEntries {
		item, err := normalizeCatalogEntry(entry, "custom")
		if err != nil {
			return nil, core.NewOperationError("import_custom_catalog", "Invalid package entry in custom catalog", err.Error(), false)
		}
		if _, dup := seen[item.PackageName]; dup {
			continue
		}
		seen[item.PackageName] = struct{}{}
		normalized = append(normalized, item)
	}
	return normalized, nil
}

func normalizeCatalogEntry(entry CatalogEntry, source string) (CatalogEntry, error) {
	pkg, err := packagemgr.ValidateStrictPackageName(entry.PackageName)
	if err != nil {
		return CatalogEntry{}, err
	}
	entry.PackageName = pkg
	entry.AppName = strings.TrimSpace(entry.AppName)
	if entry.AppName == "" {
		entry.AppName = pkg
	}
	entry.Vendor = strings.ToLower(strings.TrimSpace(entry.Vendor))
	if entry.Vendor == "" {
		entry.Vendor = "custom"
	}
	entry.Category = strings.TrimSpace(entry.Category)
	if entry.Category == "" {
		entry.Category = "Custom"
	}
	entry.Description = strings.TrimSpace(entry.Description)
	entry.Risk = normalizeRisk(entry.Risk)
	entry.Source = source
	return entry, nil
}

func normalizeRisk(risk RiskTier) RiskTier {
	switch RiskTier(strings.ToLower(strings.TrimSpace(string(risk)))) {
	case RiskSafe:
		return RiskSafe
	case RiskCritical:
		return RiskCritical
	default:
		return RiskCaution
	}
}
