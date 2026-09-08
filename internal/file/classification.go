package file

import (
	"path"
	"strings"
)

// PathClass characterizes how the user can interact with a remote Android
// file-system path under standard (AOSP) permissions. OEM-specific quirks
// (Samsung, MIUI) may push paths into different classes — those heuristics
// are deliberately out of scope for v2.0 and documented as known limitations.
type PathClass int

const (
	// PathPublic: readable + writable by the user without special grants.
	PathPublic PathClass = iota
	// PathProtected: behind scoped storage / Android/data/<pkg>/ etc.
	// Listing is possible via the MediaStore API; raw filesystem access
	// requires legacy storage, MANAGE_EXTERNAL_STORAGE, or root.
	PathProtected
	// PathSystem: device system area — not user-accessible.
	PathSystem
)

// String returns the user-facing label used in UI lists and toast hints.
func (c PathClass) String() string {
	switch c {
	case PathProtected:
		return "protected"
	case PathSystem:
		return "system"
	default:
		return "public"
	}
}

// SdCard describes a removable storage volume reported by the device, either
// the emulated internal SD card (`/sdcard`) or a physical external SD card
// under `/storage/<volume-uuid>/`.
type SdCard struct {
	// ID is the volume identifier (e.g. "primary", "external_SD1",
	// "1234-5678"). Stable across boots for the same physical card.
	ID string `json:"id"`
	// MountPoint is the canonical path, e.g. "/storage/1234-5678".
	MountPoint string `json:"mountPoint"`
	// Description is a human-friendly label for UI display.
	Description string `json:"description"`
	// IsExternal flags physical SD cards vs the emulated internal SD.
	IsExternal bool `json:"isExternal"`
}

// systemPathPrefixes are Android top-level directories the user should never
// be able to mutate from File Explorer. Mirrors validateRemoteMutationPath.
var systemPathPrefixes = []string{
	"/acct", "/apex", "/bin", "/config", "/data", "/dev", "/etc",
	"/init", "/mnt", "/proc", "/product", "/root", "/sbin", "/sys",
	"/system", "/system_ext", "/vendor", "/vendor_dlkm", "/odm_dlkm", "/metadata",
	"/boot", "/cache", "/firmware", "/persist",
}

// protectedPathPrefixes are paths the user CAN list via MediaStore but cannot
// read raw from a non-root shell on Android 11+ (scoped storage rules).
var protectedPathPrefixes = []string{
	"/sdcard/android/data",
	"/sdcard/android/obb",
	"/storage/emulated/0/android/data",
	"/storage/emulated/0/android/obb",
}

// ClassifyPath inspects a remote Android path and returns its PathClass.
// Classification happens AFTER normalizeRemotePath so paths like "sdcard" or
// "/sdcard//foo" are handled consistently.
func ClassifyPath(remotePath string) PathClass {
	cleaned, err := normalizeRemotePath(remotePath)
	if err != nil {
		return PathSystem
	}

	for _, prefix := range systemPathPrefixes {
		if cleaned == strings.TrimSuffix(prefix, "/") || strings.HasPrefix(cleaned, prefix+"/") {
			return PathSystem
		}
	}
	if cleaned == "/" || cleaned == "" {
		return PathSystem
	}

	for _, prefix := range protectedPathPrefixes {
		// Scoped-storage paths are conventionally lowercase on real devices,
		// but accept either case so user-typed or v1.3-emitted paths work.
		lower := strings.ToLower(cleaned)
		lowerPrefix := strings.ToLower(prefix)
		if lower == strings.TrimSuffix(lowerPrefix, "/") || strings.HasPrefix(lower, lowerPrefix+"/") {
			return PathProtected
		}
	}

	return PathPublic
}

// IsSdCardMountPoint reports whether a path looks like an external SD card
// mount point of the form "/storage/XXXX-XXXX" or "/mnt/media_rw/XXXX-XXXX".
// The volume id format is UUID-like (hex digits separated by dashes).
func IsSdCardMountPoint(remotePath string) bool {
	cleaned, err := normalizeRemotePath(remotePath)
	if err != nil {
		return false
	}
	prefixes := []string{"/storage/", "/mnt/media_rw/"}
	for _, prefix := range prefixes {
		if strings.HasPrefix(cleaned, prefix) {
			remainder := strings.TrimPrefix(cleaned, prefix)
			parts := strings.SplitN(remainder, "/", 2)
			if len(parts) == 0 || parts[0] == "" {
				return false
			}
			volumeId := parts[0]
			// Reject "/storage/emulated/0" — that's the internal SD, not external.
			if volumeId == "emulated" {
				return false
			}
			if strings.ContainsAny(volumeId, "-0123456789") {
				return true
			}
		}
	}
	return false
}

// ParseSdCardList parses the output of `adb shell sm list-volumes`. The
// format is one volume per line in the form "<id>:<state>" where id is a
// short label like "primary", "private", "external_SD1", or a UUID-like
// string. Example:
//
//	adb-1234: mounted
//	private: unmounted
//	1234-5678: mounted
//
// Lines that are blank, contain a header like "Volume list:", or fail to
// parse are silently skipped — the caller gets the well-formed subset.
func ParseSdCardList(output string) []SdCard {
	cards := make([]SdCard, 0, 4)
	for _, raw := range strings.Split(output, "\n") {
		line := strings.TrimSpace(raw)
		if line == "" || strings.HasPrefix(strings.ToLower(line), "volume") {
			continue
		}
		volumeID, state, ok := splitVolumeLine(line)
		if !ok {
			continue
		}
		if state != "" && !strings.EqualFold(state, "mounted") {
			continue
		}
		mount := sdCardMountPoint(volumeID)
		if mount == "" {
			continue
		}
		desc := describeVolume(volumeID)
		cards = append(cards, SdCard{
			ID:          volumeID,
			MountPoint:  mount,
			Description: desc,
			IsExternal:  isExternalVolume(volumeID),
		})
	}
	return cards
}

func splitVolumeLine(line string) (volumeID string, state string, ok bool) {
	idx := strings.Index(line, ":")
	if idx <= 0 {
		return "", "", false
	}
	volumeID = strings.TrimSpace(line[:idx])
	state = strings.TrimSpace(line[idx+1:])
	if volumeID == "" {
		return "", "", false
	}
	return volumeID, state, true
}

func sdCardMountPoint(volumeID string) string {
	if volumeID == "" {
		return ""
	}
	if strings.EqualFold(volumeID, "primary") {
		return "/storage/emulated/0"
	}
	return path.Join("/storage", volumeID)
}

func describeVolume(volumeID string) string {
	switch {
	case strings.EqualFold(volumeID, "primary"):
		return "Internal SD card"
	case strings.EqualFold(volumeID, "private"):
		return "Private volume"
	case strings.HasPrefix(strings.ToLower(volumeID), "external"):
		return "External SD card"
	}
	if isExternalVolume(volumeID) {
		return "External SD card"
	}
	return "Volume " + volumeID
}

func isExternalVolume(volumeID string) bool {
	if volumeID == "" {
		return false
	}
	if strings.EqualFold(volumeID, "primary") || strings.EqualFold(volumeID, "private") {
		return false
	}
	return true
}

// UnblockType tells the caller how to recover access to a path the user is
// trying to read or mutate.
type UnblockType int

const (
	// UnblockNotNeeded: the path is publicly accessible.
	UnblockNotNeeded UnblockType = iota
	// UnblockOpenSettings: scoped storage requires the user to grant
	// MANAGE_EXTERNAL_STORAGE or enable legacy storage via system Settings —
	// ADBKit cannot do this for them.
	UnblockOpenSettings
	// UnblockVolumeMissing: the previously-seen volume is no longer mounted
	// (SD card ejected, USB unplugged). The action is to ask the user to
	// reconnect the storage and retry.
	UnblockVolumeMissing
)

// Guidance produces a human-readable explanation for the unblock type. Kept
// short so it fits inside toast hints and dialog bodies.
func (t UnblockType) Guidance() string {
	switch t {
	case UnblockOpenSettings:
		return "This path requires system-level access. Open Settings → Apps → ADBKit → Special access → All files access, then retry."
	case UnblockVolumeMissing:
		return "The removable storage is not available. Reconnect it and tap Retry."
	default:
		return ""
	}
}

// UnblockResult is returned by Service.UnblockPath to surface the honest
// "what we can do for you" answer. We never pretend to bypass scoped storage;
// we explain what the user needs to do on their own device.
type UnblockResult struct {
	Type   UnblockType `json:"type"`
	Path   string      `json:"path"`
	Reason string      `json:"reason"`
}

// IsUnblockable reports whether any meaningful recovery action exists. Used
// by the UI to decide between "retry" (volume missing) vs "open system
// settings" (scoped storage).
func (r UnblockResult) IsUnblockable() bool {
	return r.Type != UnblockNotNeeded
}

