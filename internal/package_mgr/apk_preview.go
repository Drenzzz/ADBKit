package packagemgr

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"ADBKit/internal/core"

	"github.com/shogo82148/androidbinary/apk"
)

// APKPreview is the host-side metadata read from a local APK before it is
// installed. Reading it never touches a device and never runs the APK.
type APKPreview struct {
	FileName    string `json:"fileName"`
	SizeBytes   int64  `json:"sizeBytes"`
	PackageName string `json:"packageName"`
	AppLabel    string `json:"appLabel"`
	VersionName string `json:"versionName"`
	VersionCode string `json:"versionCode"`
	MinSDK      int    `json:"minSdk"`
	TargetSDK   int    `json:"targetSdk"`
}

// InspectAPK reads basic metadata from a local .apk file so the UI can show
// the real app name and version before the user commits to an install.
// Only the manifest and resource table are read; the APK is never executed
// and no payload is extracted to disk.
func (s *Service) InspectAPK(filePath string) (APKPreview, error) {
	trimmedPath := strings.TrimSpace(filePath)
	if trimmedPath == "" {
		return APKPreview{}, core.NewOperationError("inspect_apk", "APK file path is required", "file path must not be empty", false)
	}
	if err := core.ValidateAPKFile(trimmedPath); err != nil {
		return APKPreview{}, err
	}

	info, err := os.Stat(trimmedPath)
	if err != nil {
		return APKPreview{}, core.NewOperationError("inspect_apk", "APK could not be accessed", err.Error(), false)
	}

	parsed, err := apk.OpenFile(trimmedPath)
	if err != nil {
		return APKPreview{}, core.NewOperationError("inspect_apk", "Could not read APK metadata", "file may be corrupt or not an installable APK: "+err.Error(), false)
	}
	defer parsed.Close()

	label, err := parsed.Label(nil)
	if err != nil {
		return APKPreview{}, core.NewOperationError("inspect_apk", "Could not read APK label", err.Error(), false)
	}

	manifest := parsed.Manifest()
	versionCode := ""
	if code, err := manifest.VersionCode.Int32(); err == nil && code > 0 {
		versionCode = fmt.Sprintf("%d", code)
	}
	minSDK := 0
	if value, err := manifest.SDK.Min.Int32(); err == nil && value > 0 {
		minSDK = int(value)
	}
	targetSDK := 0
	if value, err := manifest.SDK.Target.Int32(); err == nil && value > 0 {
		targetSDK = int(value)
	}

	versionName := ""
	if name, err := manifest.VersionName.String(); err == nil {
		versionName = strings.TrimSpace(name)
	}

	preview := APKPreview{
		FileName:    filepath.Base(trimmedPath),
		SizeBytes:   info.Size(),
		PackageName: parsed.PackageName(),
		AppLabel:    label,
		VersionCode: versionCode,
		VersionName: versionName,
		MinSDK:      minSDK,
		TargetSDK:   targetSDK,
	}

	return preview, nil
}
