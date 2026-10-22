package download

// manifest is the single place where managed-download versions and checksums
// live. When a download fails checksum verification, re-hash the official
// archive and update the pin here — never remove or blank a pin.
//
// Pin history: Google republished platform-tools 37.0.1-win.zip (SHA rotated
// from 84df1e... to 45f4d6... on 2026-08-27) and the pin was removed for a
// while, silently disabling verification. Pins below were re-derived from the
// live archives on 2026-10-14. scrcpy pins come from the immutable GitHub
// release and its SHA256SUMS.txt.
type manifest struct {
	PlatformToolsVersion string            `json:"platform_tools_version"`
	PlatformToolsSHA256  map[string]string `json:"platform_tools_sha256"` // keyed by GOOS
	ScrcpyVersion        string            `json:"scrcpy_version"`
	ScrcpySHA256         map[string]string `json:"scrcpy_sha256"` // keyed by GOOS/GOARCH
}

var downloadManifest = manifest{
	PlatformToolsVersion: "37.0.1",
	PlatformToolsSHA256: map[string]string{
		"linux":   "d230f13842f60f782a8645f9c813f8f845bf36089ea7289f28c48f17979313f1",
		"darwin":  "ee39ad5967e95c2a07f04dbcbde96b1a0c916ba376096db5d2f498b7727a5d1d",
		"windows": "45f4d63113e895ebde0c90f194099a4676b6ac653bd28d54314a9e022bbc1a99",
	},
	ScrcpyVersion: "5.0.1",
	// darwin/arm64 is intentionally absent: no tester has verified the macOS
	// arm64 package yet, so downloads must fail fast instead of pulling 12 MB.
	ScrcpySHA256: map[string]string{
		"linux/amd64":   "9f969d30cc574816077edecda65719c1c70b0aee1df1ba5fa00779ac07b8fd6e",
		"darwin/amd64":  "31a5467a9e907f162b093267cbbab1276b15c6e709c2ea8159566a8d165beb50",
		"windows/amd64": "b12a2c4ee8be317422451fc7dcf8ee20a71b5ea7ef9ad73ddd825a25316227a5",
		"windows/arm64": "16c3fc2068df64946f670e3504b4752073ebae47a416a45b46e79a5ab19c689b",
	},
}
