package packagemgr

import (
	"regexp"
	"sort"
	"strings"
)

// PackagePermission represents a single Android permission for an app.
type PackagePermission struct {
	Name      string `json:"name"`
	Label     string `json:"label"`
	Group     string `json:"group"`
	IsRuntime bool   `json:"isRuntime"`
	IsGranted bool   `json:"isGranted"`
}

// PackageAppOp represents an AppOps entry.
type PackageAppOp struct {
	Name  string `json:"name"`
	Label string `json:"label"`
	Mode  string `json:"mode"`
}

// PackagePermissionsReport is returned by GetPackagePermissions.
type PackagePermissionsReport struct {
	PackageName     string              `json:"packageName"`
	Permissions     []PackagePermission `json:"permissions"`
	AppOps          []PackageAppOp      `json:"appOps"`
	AppOpsSupported bool                `json:"appOpsSupported"`
}

// Curated label maps for ~25 runtime + ~35 appops.
var permissionLabelMap = map[string]string{
	"android.permission.CAMERA":                     "Camera",
	"android.permission.RECORD_AUDIO":               "Microphone",
	"android.permission.ACCESS_FINE_LOCATION":       "Fine location",
	"android.permission.ACCESS_COARSE_LOCATION":     "Coarse location",
	"android.permission.ACCESS_BACKGROUND_LOCATION": "Background location",
	"android.permission.READ_CONTACTS":              "Read contacts",
	"android.permission.WRITE_CONTACTS":             "Write contacts",
	"android.permission.GET_ACCOUNTS":               "Get accounts",
	"android.permission.READ_CALL_LOG":              "Read call log",
	"android.permission.READ_PHONE_STATE":           "Phone state",
	"android.permission.CALL_PHONE":                 "Make calls",
	"android.permission.ANSWER_PHONE_CALLS":         "Answer phone calls",
	"android.permission.READ_SMS":                   "Read SMS",
	"android.permission.RECEIVE_SMS":                "Receive SMS",
	"android.permission.SEND_SMS":                   "Send SMS",
	"android.permission.READ_MEDIA_IMAGES":         "Media images",
	"android.permission.READ_MEDIA_VIDEO":          "Media video",
	"android.permission.READ_MEDIA_AUDIO":          "Media audio",
	"android.permission.READ_EXTERNAL_STORAGE":     "Read external storage",
	"android.permission.WRITE_EXTERNAL_STORAGE":    "Write external storage",
	"android.permission.ACCESS_MEDIA_LOCATION":     "Media location",
	"android.permission.READ_CALENDAR":             "Read calendar",
	"android.permission.WRITE_CALENDAR":            "Write calendar",
	"android.permission.BODY_SENSORS":              "Body sensors",
	"android.permission.ACTIVITY_RECOGNITION":      "Physical activity",
	"android.permission.BLUETOOTH_CONNECT":         "Bluetooth connect",
	"android.permission.BLUETOOTH_SCAN":            "Bluetooth scan",
	"android.permission.NEARBY_WIFI_DEVICES":       "Nearby Wi-Fi",
	"android.permission.POST_NOTIFICATIONS":        "Notifications",
	"android.permission.READ_NEARBY_WIFI_DEVICES":  "Nearby Wi-Fi",
}

var permissionGroupMap = map[string]string{
	"android.permission.CAMERA":                     "Camera",
	"android.permission.RECORD_AUDIO":               "Microphone",
	"android.permission.ACCESS_FINE_LOCATION":       "Location",
	"android.permission.ACCESS_COARSE_LOCATION":     "Location",
	"android.permission.ACCESS_BACKGROUND_LOCATION": "Location",
	"android.permission.ACCESS_MEDIA_LOCATION":      "Location",
	"android.permission.READ_CONTACTS":              "Contacts",
	"android.permission.WRITE_CONTACTS":             "Contacts",
	"android.permission.GET_ACCOUNTS":               "Contacts",
	"android.permission.READ_CALL_LOG":              "Phone",
	"android.permission.READ_PHONE_STATE":           "Phone",
	"android.permission.CALL_PHONE":                 "Phone",
	"android.permission.ANSWER_PHONE_CALLS":         "Phone",
	"android.permission.READ_SMS":                   "SMS",
	"android.permission.RECEIVE_SMS":                "SMS",
	"android.permission.SEND_SMS":                   "SMS",
	"android.permission.READ_MEDIA_IMAGES":         "Media",
	"android.permission.READ_MEDIA_VIDEO":          "Media",
	"android.permission.READ_MEDIA_AUDIO":          "Media",
	"android.permission.READ_EXTERNAL_STORAGE":     "Storage",
	"android.permission.WRITE_EXTERNAL_STORAGE":    "Storage",
	"android.permission.READ_CALENDAR":             "Calendar",
	"android.permission.WRITE_CALENDAR":            "Calendar",
	"android.permission.BODY_SENSORS":              "Sensors",
	"android.permission.ACTIVITY_RECOGNITION":      "Sensors",
	"android.permission.BLUETOOTH_CONNECT":         "Nearby",
	"android.permission.BLUETOOTH_SCAN":            "Nearby",
	"android.permission.NEARBY_WIFI_DEVICES":       "Nearby",
	"android.permission.READ_NEARBY_WIFI_DEVICES":  "Nearby",
	"android.permission.POST_NOTIFICATIONS":        "Notifications",
}

var knownRuntimePermissions = map[string]bool{
	"android.permission.CAMERA":                     true,
	"android.permission.RECORD_AUDIO":               true,
	"android.permission.ACCESS_FINE_LOCATION":       true,
	"android.permission.ACCESS_COARSE_LOCATION":     true,
	"android.permission.ACCESS_BACKGROUND_LOCATION": true,
	"android.permission.READ_CONTACTS":              true,
	"android.permission.WRITE_CONTACTS":             true,
	"android.permission.GET_ACCOUNTS":               true,
	"android.permission.READ_CALL_LOG":              true,
	"android.permission.READ_PHONE_STATE":           true,
	"android.permission.CALL_PHONE":                 true,
	"android.permission.ANSWER_PHONE_CALLS":         true,
	"android.permission.READ_SMS":                   true,
	"android.permission.RECEIVE_SMS":                true,
	"android.permission.SEND_SMS":                   true,
	"android.permission.READ_MEDIA_IMAGES":         true,
	"android.permission.READ_MEDIA_VIDEO":          true,
	"android.permission.READ_MEDIA_AUDIO":          true,
	"android.permission.READ_EXTERNAL_STORAGE":     true,
	"android.permission.ACCESS_MEDIA_LOCATION":     true,
	"android.permission.READ_CALENDAR":             true,
	"android.permission.WRITE_CALENDAR":            true,
	"android.permission.BODY_SENSORS":              true,
	"android.permission.ACTIVITY_RECOGNITION":      true,
	"android.permission.BLUETOOTH_CONNECT":         true,
	"android.permission.BLUETOOTH_SCAN":            true,
	"android.permission.NEARBY_WIFI_DEVICES":       true,
	"android.permission.READ_NEARBY_WIFI_DEVICES":  true,
	"android.permission.POST_NOTIFICATIONS":        true,
}

var appOpLabelMap = map[string]string{
	"COARSE_LOCATION":              "Coarse location",
	"FINE_LOCATION":                "Fine location",
	"GPS":                          "GPS",
	"MONITORED_LOCATION":           "Background location",
	"CAMERA":                       "Camera",
	"RECORD_AUDIO":                 "Microphone",
	"READ_CONTACTS":                "Read contacts",
	"WRITE_CONTACTS":               "Write contacts",
	"READ_CALL_LOG":                "Read call log",
	"WRITE_CALL_LOG":               "Write call log",
	"READ_PHONE_STATE":             "Phone state",
	"CALL_PHONE":                   "Make calls",
	"READ_SMS":                     "Read SMS",
	"SEND_SMS":                     "Send SMS",
	"RECEIVE_SMS":                  "Receive SMS",
	"READ_CLIPBOARD":               "Read clipboard",
	"WRITE_CLIPBOARD":              "Write clipboard",
	"SYSTEM_ALERT_WINDOW":          "Draw over other apps",
	"WRITE_SETTINGS":               "Modify system settings",
	"WRITE_SECURE_SETTINGS":        "Modify secure settings",
	"MANAGE_EXTERNAL_STORAGE":      "All files access",
	"PACKAGE_USAGE_STATS":          "Usage access",
	"GET_USAGE_STATS":              "Usage stats",
	"ACCESS_RESTRICTED_SETTINGS":   "Restricted settings",
	"REQUEST_INSTALL_PACKAGES":     "Install unknown apps",
	"RUN_IN_BACKGROUND":            "Run in background",
	"RUN_ANY_IN_BACKGROUND":        "Run any in background",
	"START_FOREGROUND":             "Foreground service",
	"POST_NOTIFICATION":            "Post notifications",
	"NOTIFICATION":                 "Notifications",
	"READ_MEDIA_IMAGES":            "Media images",
	"READ_MEDIA_VIDEO":             "Media video",
	"READ_MEDIA_AUDIO":             "Media audio",
	"READ_MEDIA_VISUAL_USER_SELECT": "Selected media",
	"ACTIVATE_VPN":                 "VPN",
	"WRITE_SMS":                    "Write SMS",
	"RECEIVE_MMS":                  "Receive MMS",
	"MOCK_LOCATION":                "Mock location",
}

var permissionNameRe = regexp.MustCompile(`^[A-Za-z0-9_.]+$`)
var appOpNameRe = regexp.MustCompile(`^[A-Za-z0-9_.:]+$`)
var appOpModeRe = regexp.MustCompile(`^(allow|ignore|deny|default)$`)

func validatePermissionName(name string) bool {
	if name == "" {
		return false
	}
	return permissionNameRe.MatchString(name)
}

func validateAppOpName(name string) bool {
	if name == "" {
		return false
	}
	return appOpNameRe.MatchString(name)
}

func validateAppOpMode(mode string) bool {
	return appOpModeRe.MatchString(strings.ToLower(strings.TrimSpace(mode)))
}

func permissionLabel(name string) string {
	if lbl, ok := permissionLabelMap[name]; ok {
		return lbl
	}
	// fallback: last segment -> Title case with spaces
	parts := strings.Split(name, ".")
	last := parts[len(parts)-1]
	// snake to space
	last = strings.ReplaceAll(last, "_", " ")
	// simple title
	return strings.Title(strings.ToLower(last))
}

func permissionGroup(name string) string {
	if g, ok := permissionGroupMap[name]; ok {
		return g
	}
	return "Other"
}

func appOpLabel(name string) string {
	if lbl, ok := appOpLabelMap[name]; ok {
		return lbl
	}
	if lbl, ok := appOpLabelMap[strings.ToUpper(name)]; ok {
		return lbl
	}
	// also handle android:op format
	base := name
	if strings.Contains(base, ":") {
		parts := strings.Split(base, ":")
		base = parts[len(parts)-1]
	}
	base = strings.ToUpper(base)
	if lbl, ok := appOpLabelMap[base]; ok {
		return lbl
	}
	// fallback
	base = strings.ReplaceAll(base, "_", " ")
	return strings.Title(strings.ToLower(base))
}

func appOpKey(op string) string {
	// normalize for display grouping: strip android: prefix
	op = strings.TrimSpace(op)
	if strings.Contains(op, ":") {
		parts := strings.Split(op, ":")
		return parts[len(parts)-1]
	}
	return op
}

// parseDumpsysPermissions parses `dumpsys package <pkg>` output.
// Handles both `runtime permissions:` and `install permissions:` blocks.
func parseDumpsysPermissions(output string) []PackagePermission {
	seen := make(map[string]int)
	result := make([]PackagePermission, 0, 32)
	currentBlock := "" // "runtime", "install", ""

	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		lower := strings.ToLower(line)
		if strings.Contains(lower, "runtime permissions:") {
			currentBlock = "runtime"
			continue
		}
		if strings.Contains(lower, "install permissions:") {
			currentBlock = "install"
			continue
		}
		// block ends when indentation returns and new header appears like "User 0:"
		if strings.HasPrefix(line, "Package ") || strings.HasPrefix(lower, "user ") || strings.HasPrefix(lower, "hidden:") || strings.HasPrefix(lower, "isorphaned") {
			// heuristic: keep block until another major section, but no strict need to reset
			// We keep currentBlock as is unless it's clearly outside permissions; for safety, reset on "Package ["? Keep simple: continue parsing is fine.
		}
		// permission line: android.permission.X: granted=true/false, flags=[...]
		if !strings.HasPrefix(line, "android.permission.") {
			continue
		}
		colonIdx := strings.Index(line, ":")
		if colonIdx < 0 {
			continue
		}
		permName := strings.TrimSpace(line[:colonIdx])
		if !validatePermissionName(permName) {
			continue
		}
		rest := line[colonIdx+1:]
		isGranted := strings.Contains(strings.ToLower(rest), "granted=true")
		// For install perms, always considered granted if line exists; but parse flag still
		// We treat presence as granted if no explicit granted=false? Keep parsing false for install would be weird.
		// So for install block, if no granted= tag, assume granted.
		if currentBlock == "install" && !strings.Contains(strings.ToLower(rest), "granted=") {
			isGranted = true
		}
		isRuntime := currentBlock == "runtime"
		if _, known := knownRuntimePermissions[permName]; known {
			isRuntime = true
		}
		// if unknown and in install block, keep as install
		if currentBlock == "install" && !knownRuntimePermissions[permName] {
			isRuntime = false
		}
		perm := PackagePermission{
			Name:      permName,
			Label:     permissionLabel(permName),
			Group:     permissionGroup(permName),
			IsRuntime: isRuntime,
			IsGranted: isGranted,
		}
		if idx, ok := seen[permName]; ok {
			// merge: granted wins
			if perm.IsGranted {
				result[idx].IsGranted = true
			}
			if perm.IsRuntime {
				result[idx].IsRuntime = true
			}
			continue
		}
		seen[permName] = len(result)
		result = append(result, perm)
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].Group != result[j].Group {
			return result[i].Group < result[j].Group
		}
		return result[i].Name < result[j].Name
	})
	return result
}

// parseAppOps parses `cmd appops get <pkg>` output.
// Supports formats:
//   CAMERA: allow; time=123
//   android:coarse_location: ignore
//   Uid mode: ... (skipped)
//   No operations.
func parseAppOps(output string) ([]PackageAppOp, bool) {
	trimmed := strings.TrimSpace(output)
	if trimmed == "" {
		return nil, false
	}
	lower := strings.ToLower(trimmed)
	if strings.Contains(lower, "no operations") || strings.Contains(lower, "no operation") {
		return []PackageAppOp{}, true
	}
	seen := make(map[string]int)
	result := make([]PackageAppOp, 0, 32)

	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		lowerLine := strings.ToLower(line)
		if strings.HasPrefix(lowerLine, "uid mode:") || strings.HasPrefix(lowerLine, "package ") || strings.HasPrefix(lowerLine, "uid ") {
			continue
		}
		// Must contain colon
		colonIdx := strings.LastIndex(line, ":")
		if colonIdx < 0 {
			// some formats: OP mode -> split space
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				// try last token as mode
				last := strings.ToLower(strings.TrimSpace(fields[len(fields)-1]))
				// trim ; time etc
				if semi := strings.Index(last, ";"); semi >= 0 {
					last = last[:semi]
				}
				if validateAppOpMode(last) {
					opName := strings.Join(fields[:len(fields)-1], " ")
					opName = strings.TrimSuffix(opName, ":")
					opName = strings.TrimSpace(opName)
					if !validateAppOpName(opName) && !validateAppOpName(strings.ReplaceAll(opName, " ", "_")) {
						continue
					}
					key := strings.ToUpper(appOpKey(opName))
					if idx, ok := seen[key]; ok {
						result[idx].Mode = strings.ToLower(last)
						continue
					}
					seen[key] = len(result)
					result = append(result, PackageAppOp{
						Name:  key,
						Label: appOpLabel(key),
						Mode:  strings.ToLower(last),
					})
				}
			}
			continue
		}
		opPart := strings.TrimSpace(line[:colonIdx])
		rest := strings.TrimSpace(line[colonIdx+1:])
		// rest: "allow; time=..." or "allow"
		modeToken := rest
		if semi := strings.Index(rest, ";"); semi >= 0 {
			modeToken = strings.TrimSpace(rest[:semi])
		}
		modeToken = strings.Fields(modeToken)[0]
		modeToken = strings.ToLower(strings.TrimSpace(modeToken))
		if !validateAppOpMode(modeToken) {
			continue
		}
		// Normalize op name: use appOpKey to strip prefix, but keep upper for uniqueness
		normalizedKey := strings.ToUpper(appOpKey(opPart))
		if !validateAppOpName(normalizedKey) && !validateAppOpName(strings.ReplaceAll(normalizedKey, " ", "_")) {
			// try raw opPart as fallback
			if !validateAppOpName(opPart) {
				continue
			}
		}
		if idx, ok := seen[normalizedKey]; ok {
			result[idx].Mode = modeToken
			continue
		}
		seen[normalizedKey] = len(result)
		result = append(result, PackageAppOp{
			Name:  normalizedKey,
			Label: appOpLabel(normalizedKey),
			Mode:  modeToken,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})
	return result, true
}
