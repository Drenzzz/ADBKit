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
	ScrcpySHA256         map[string]string `json:"scrcpy_sha256"` // keyed by GOOS
}

var downloadManifest = manifest{
	PlatformToolsVersion: "37.0.1",
	PlatformToolsSHA256: map[string]string{
		"linux":   "d230f13842f60f782a8645f9c813f8f845bf36089ea7289f28c48f17979313f1",
		"darwin":  "ee39ad5967e95c2a07f04dbcbde96b1a0c916ba376096db5d2f498b7727a5d1d",
		"windows": "45f4d63113e895ebde0c90f194099a4676b6ac653bd28d54314a9e022bbc1a99",
	},
	ScrcpyVersion: "4.0",
	ScrcpySHA256: map[string]string{
		"linux":   "7daf05af5d575862e62b068cf6852d6068faf7ef3178f3735e3953e778fbf0ab",
		"darwin":  "b83169f856d7022ed0e4428d98acea18dde2d63f49611b52ea137577ce4efe6b",
		"windows": "75dbeb5b00e6f64292f26f70900ae55ca397786bdfb0b9bbeb481a0549047457",
	},
}
